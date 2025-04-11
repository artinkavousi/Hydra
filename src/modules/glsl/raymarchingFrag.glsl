// AMOUNT replaces at call position

struct Data {
  vec3 position;
  float scale;
};

uniform float u_aspect;
uniform Data u_datas[AMOUNT];
uniform sampler2D u_texture;
uniform sampler2D u_envMap;
uniform sampler2D u_matcapTexture;
uniform vec2 u_uvScale;
uniform float u_time;

// Optical properties
uniform float u_ior;
uniform float u_dispersion;
uniform float u_reflectionStrength;
uniform float u_refractionStrength;
uniform float u_refractionDepth;
uniform float u_secondaryIOR;
uniform float u_opacity;

// Surface properties
uniform float u_surfaceDistortion;
uniform float u_surfaceRoughness;
uniform float u_bumpScale;

// Iridescence properties
uniform float u_iridescenceStrength;
uniform float u_iridescenceFrequency;

// Visual effects
uniform float u_causticIntensity;
uniform float u_internalPatternIntensity;
uniform float u_rimLightIntensity;
uniform float u_bubbleDensity;
uniform float u_causticSpeed;
uniform float u_causticScale;
uniform float u_bubbleSpeed;
uniform float u_bubbleSize;
uniform vec3 u_rimColor;
uniform float u_rimWidth;

// Color properties
uniform vec3 u_glassTint;
uniform vec3 u_absorptionColor;
uniform float u_absorptionDensity;

// Matcap properties
uniform float u_matcapStrength;
uniform float u_matcapBlendMode;
uniform float u_matcapFresnelBias;
uniform float u_matcapFresnelScale;
uniform float u_matcapFresnelPower;

// --- Add Audio Reactive Uniforms ---
uniform float u_audioLevel;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;
// --- End Audio Uniforms ---

varying vec2 v_uv;

const int COUNT = AMOUNT;

#include './fresnel.glsl'
#include './raymarching/primitives.glsl'
#include './raymarching/combinations.glsl'

// Add noise function for surface perturbation
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f*f*(3.0-2.0*f); // Smooth interpolation
  
  vec2 uv = (i.xy + vec2(37.0, 17.0) * i.z) + f.xy;
  vec2 rg = vec2(
    sin(uv.x * 0.1 + uv.y * 0.3) * 0.5 + 0.5,
    sin(uv.x * 0.5 - uv.y * 0.8) * 0.5 + 0.5
  );
  return mix(rg.x, rg.y, f.z);
}

// Time-based distortion for subtle movement
float animatedNoise(vec3 p) {
  // Use sin/cos for smoother periodic movement
  float timeFactor = u_time * 0.1;
  return noise(p + vec3(sin(timeFactor * 0.8) * 0.1, cos(timeFactor * 0.6) * 0.1, sin(timeFactor * 1.1) * 0.1));
}

// Generate 3D cellular noise (for bubbles and impurities)
float cellular(vec3 p) {
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  
  float d = 1.0;

  // Use a smoother time factor for bubble animation
  float bubbleTime = u_time * u_bubbleSpeed * 0.5;
  
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      for (int k = -1; k <= 1; k++) {
        vec3 offset = vec3(float(i), float(j), float(k));
        // Add audio reactivity to bubble seed points (low frequency)
        float audioInfluence = u_audioLow * 0.2;
        vec3 n = offset + 0.5 * sin(bubbleTime + 
                         6.2831 * vec3(
                            noise(ip + offset),
                            noise(ip + offset + 31.5),
                            noise(ip + offset + 67.3)
                         )) + vec3(sin(bubbleTime * 1.1 + float(i) * 2.0) * audioInfluence, 
                                cos(bubbleTime * 0.9 + float(j) * 1.5) * audioInfluence, 
                                sin(bubbleTime * 1.3 + float(k) * 2.5) * audioInfluence);
        float dist = length(fp - n);
        d = min(d, dist);
      }
    }
  }
  
  // Modulate bubble size slightly with audio level
  float finalBubbleSize = u_bubbleSize * (1.0 + u_audioLevel * 0.2);
  return 1.0 - smoothstep(0.0, 0.2 * finalBubbleSize, d);
}

// Function to generate iridescent colors
vec3 calculateIridescence(vec3 normal, vec3 viewDir) {
  // Calculate the angle between the normal and view direction
  float cosAngle = abs(dot(normalize(normal), normalize(viewDir)));
  
  // Transform the angle to create color shift - make time influence smoother
  float timeFactor = sin(u_time * 0.05);
  float colorShift = cosAngle * u_iridescenceFrequency + timeFactor;
  
  // Generate rainbow colors
  vec3 iridescence;
  iridescence.r = 0.5 + 0.5 * sin(colorShift);
  iridescence.g = 0.5 + 0.5 * sin(colorShift + 2.094); // 2.094 = 2π/3
  iridescence.b = 0.5 + 0.5 * sin(colorShift + 4.188); // 4.188 = 4π/3
  
  return iridescence;
}

// Bump mapping function
vec3 bumpNormal(vec3 pos, vec3 normal) {
  // Sample noise at different positions to calculate gradient
  float noiseScale = 30.0;
  float bump = u_bumpScale;
  
  // Calculate offset points for finite difference
  float delta = 0.01;
  vec3 dx = vec3(delta, 0.0, 0.0);
  vec3 dy = vec3(0.0, delta, 0.0);
  vec3 dz = vec3(0.0, 0.0, delta);
  
  // Calculate height field differences
  float h0 = noise(pos * noiseScale);
  float h1 = noise((pos + dx) * noiseScale);
  float h2 = noise((pos + dy) * noiseScale);
  float h3 = noise((pos + dz) * noiseScale);
  
  // Calculate gradient
  vec3 grad = vec3(h1 - h0, h2 - h0, h3 - h0) / delta;
  
  // Generate new normal
  vec3 newNormal = normalize(normal - grad * bump);
  
  // Interpolate between original and bumped normal based on roughness
  return normalize(mix(normal, newNormal, 1.0 - u_surfaceRoughness));
}

float sdf(vec3 p) {
  vec3 correct = vec3(u_aspect, 1.0, 1.0) * vec3(0.08, 0.15, 0.2);

  // Add subtle time-based movement to the droplets
  vec3 timeOffset = vec3(
    sin(u_time * 0.2) * 0.01,
    cos(u_time * 0.3) * 0.01,
    0.0
  );

  vec3 pos = p + -(u_datas[0].position + timeOffset) * correct;
  float final = sdSphere(pos, 0.2 * u_datas[0].scale);

  for(int i = 1; i < COUNT; i++) {
    // Add unique subtle movement to each droplet
    vec3 uniqueOffset = vec3(
      sin(u_time * 0.1 + float(i) * 0.5) * 0.01,
      cos(u_time * 0.15 + float(i) * 0.3) * 0.01,
      0.0
    );
    
    pos = p + -(u_datas[i].position + uniqueOffset) * correct;
    float sphere = sdSphere(pos, 0.2 * u_datas[i].scale);
    final = opSmoothUnion(final, sphere, 0.4);
  }

  return final;
}

#include './raymarching/normal.glsl'

// Perturb normal to create microscopic surface irregularities
vec3 perturbNormal(vec3 position, vec3 normal) {
  // Scale position for different noise frequencies
  float scale = 30.0;
  
  // Add time-based animation to the noise - use smooth sin/cos time
  float timeInfluence = sin(u_time * 0.05) * 0.5; // Smoother time factor
  
  // Calculate noise gradient with time animation
  float eps = 0.01;
  // Apply audio reactivity (mid frequencies) to distortion strength
  float distortionStrength = u_surfaceDistortion * (1.0 + u_audioMid * 1.5);
  
  float nx = animatedNoise(position * scale + vec3(eps, 0.0, timeInfluence)) - animatedNoise(position * scale - vec3(eps, 0.0, timeInfluence));
  float ny = animatedNoise(position * scale + vec3(0.0, eps, timeInfluence)) - animatedNoise(position * scale - vec3(0.0, eps, timeInfluence));
  float nz = animatedNoise(position * scale + vec3(0.0, 0.0, eps + timeInfluence)) - animatedNoise(position * scale - vec3(0.0, 0.0, eps - timeInfluence));
  
  // Add to normal with attenuation using the control parameter & audio modulation
  vec3 noiseVec = vec3(nx, ny, nz) * distortionStrength;
  
  // Ensure the normal remains facing outward
  return normalize(normal + noiseVec);
}

// Enhanced refraction with chromatic aberration
vec3 calculateDispersion(vec3 normal, vec2 uv) {
  // Ensure IOR is in valid range to prevent issues
  float safeIOR = max(1.01, min(u_ior, 3.0));
  float safeDispersionAmount = max(0.0, min(u_dispersion, 0.1));
  
  // Different IOR values for each color channel
  float redIOR = safeIOR - safeDispersionAmount;
  float greenIOR = safeIOR;
  float blueIOR = safeIOR + safeDispersionAmount;

  // Calculate refraction strength with safety clamp
  float strength = max(0.0, min(u_refractionStrength, 2.0));
  
  // Calculate offset scale based on refraction depth
  float depthFactor = max(0.1, min(u_refractionDepth, 3.0));
  
  // Calculate offset directions based on normal
  vec2 offsetDir = normal.xy * strength * depthFactor;
  
  // Apply different offsets for each channel
  float redOffset = (1.0 + safeDispersionAmount) * 0.1;
  float blueOffset = (1.0 - safeDispersionAmount) * 0.1;
  
  // Calculate UV offsets for each channel
  vec2 redUV = uv + offsetDir * redOffset;
  vec2 greenUV = uv + offsetDir * 0.1;
  vec2 blueUV = uv + offsetDir * blueOffset;
  
  // Sample the texture for each channel
  float r = texture2D(u_texture, redUV).r;
  float g = texture2D(u_texture, greenUV).g;
  float b = texture2D(u_texture, blueUV).b;
  
  return vec3(r, g, b);
}

// Calculate birefringence (double refraction effect)
vec3 calculateBirefringence(vec3 normal, vec2 uv) {
  // Safety check for secondary IOR value
  float birefringenceStrength = max(0.0, min(u_secondaryIOR, 1.0));
  
  if (birefringenceStrength < 0.01) return vec3(0.0);
  
  // Create orthogonal vectors to the normal for secondary refraction
  vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
  if (length(tangent) < 0.1) tangent = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
  
  // Calculate secondary direction
  vec3 bitangent = normalize(cross(normal, tangent));
  vec3 secondaryDir = normalize(
    normal + 
    tangent * sin(u_time * 0.2) * birefringenceStrength + 
    bitangent * cos(u_time * 0.3) * birefringenceStrength
  );
  
  // Calculate offset for the secondary ray
  float depthFactor = max(0.1, min(u_refractionDepth, 3.0));
  vec2 secondaryUV = uv + secondaryDir.xy * 0.08 * birefringenceStrength * depthFactor;
  
  // Sample texture at the secondary position
  vec3 secondaryColor = texture2D(u_texture, secondaryUV).rgb;
  
  return secondaryColor;
}

// Calculate matcap UV coordinates based on the view and normal
vec2 calculateMatcapUV(vec3 normal, vec3 viewDir) {
  // Transform the normal to view space
  vec3 viewNormal = normalize(normal);
  
  // Calculate the reflection vector
  vec3 r = reflect(viewDir, viewNormal);
  
  // Normalize the reflection vector
  float m = 2.0 * sqrt(
    r.x * r.x +
    r.y * r.y +
    (r.z + 1.0) * (r.z + 1.0)
  );
  
  // Map to UV space
  vec2 matcapUV = vec2(r.x / m + 0.5, r.y / m + 0.5);
  
  return matcapUV;
}

// Custom Fresnel function for matcap blending
float matcapFresnel(vec3 viewDirection, vec3 normal) {
  // Calculate basic fresnel with custom parameters
  float bias = u_matcapFresnelBias;
  float scale = u_matcapFresnelScale;
  float power = u_matcapFresnelPower;
  
  float NdotV = max(0.0, dot(normal, -viewDirection));
  return bias + scale * pow(1.0 - NdotV, power);
}

// Blend modes for matcap
vec3 blendMatcap(vec3 base, vec3 matcap, float mode, float strength) {
  // Normal blend (mode = 0)
  if (mode < 0.5) {
    return mix(base, matcap, strength);
  }
  // Additive blend (mode = 1)
  else if (mode < 1.5) {
    return base + matcap * strength;
  }
  // Multiply blend (mode = 2)
  else {
    return base * mix(vec3(1.0), matcap, strength);
  }
}

void main() {
  vec2 centeredUV = (v_uv - 0.5) * vec2(u_aspect, 1.0);
  vec3 ray = normalize(vec3(centeredUV, -1.0));
  
  vec3 camPos = vec3(0.0, 0.0, 2.3);
  vec3 rayPos = camPos;
  float totalDist = 0.0;
  float tMax = 5.0;

  // Raymarching loop
  for(int i = 0; i < 256; i++) {
    float dist = sdf(rayPos);
    if (dist < 0.0001 || tMax < totalDist) break;
    totalDist += dist;
    rayPos = camPos + totalDist * ray;
  }

  vec2 uv = (v_uv - 0.5) * u_uvScale + 0.5;
  vec4 tex = texture2D(u_texture, uv);
  vec4 outgoing = tex;

  // If we hit a water drop
  if(totalDist < tMax) {
    vec3 normal = calcNormal(rayPos);
    
    // Add surface irregularities to the normal
    normal = perturbNormal(rayPos, normal);
    
    // Add bump mapping
    normal = bumpNormal(rayPos, normal);
    
    // Calculate fresnel for reflection/refraction mix
    float f = fresnel(ray, normal);
    
    // Calculate reflection
    vec3 reflectedRay = reflect(ray, normal);
    vec2 envUV = reflectedRay.xy * 0.5 + 0.5;
    vec4 envReflection = texture2D(u_envMap, envUV);
    
    // Reflection from background with strength factor
    vec2 reflectedUV = uv + reflectedRay.xy * 0.1 * u_reflectionStrength;
    vec4 reflectionColor = mix(texture2D(u_texture, reflectedUV), envReflection, 0.3);
    
    // Calculate refraction with chromatic aberration/dispersion
    vec3 refractionColor = calculateDispersion(normal, uv);
    
    // Add birefringence (secondary refraction) if enabled
    if (u_secondaryIOR > 0.01) {
      vec3 birefringenceColor = calculateBirefringence(normal, uv);
      refractionColor = mix(refractionColor, birefringenceColor, u_secondaryIOR * 0.5);
    }
    
    // Calculate iridescence
    vec3 iridescenceColor = calculateIridescence(normal, ray);
    
    // Create rim lighting effect at edges
    float rim = pow(1.0 - abs(dot(ray, normal)), u_rimWidth) * u_rimLightIntensity;
    vec3 highlightColor = u_rimColor * rim;
    
    // Add caustics effect - use smoother time, audio reactivity (high frequencies)
    float timeFactorCaustic = sin(u_time * u_causticSpeed * 0.2);
    float reactiveCausticScale = u_causticScale * (1.0 + u_audioHigh * 0.5);
    float causticPattern = pow(
      sin(rayPos.x * reactiveCausticScale + rayPos.y * (reactiveCausticScale*0.6) + rayPos.z * (reactiveCausticScale*0.4) + timeFactorCaustic) * 0.5 + 0.5, 
      8.0
    ) * u_causticIntensity * (1.0 + u_audioHigh * 1.0); // Boost intensity with highs
    
    // Generate internal bubbles
    float bubbles = cellular(rayPos * 30.0 * u_bubbleDensity) * u_bubbleDensity * 0.5;
    
    // Mix reflection and refraction based on fresnel
    vec3 baseColor = mix(refractionColor, reflectionColor.rgb, f);
    
    // Add iridescence effect
    baseColor = mix(baseColor, iridescenceColor, u_iridescenceStrength * (1.0 - f));
    
    // Apply glass tint
    baseColor *= u_glassTint;
    
    // Calculate matcap UVs
    vec2 matcapUV = calculateMatcapUV(normal, ray);
    vec3 matcapColor = texture2D(u_matcapTexture, matcapUV).rgb;
    
    // Calculate matcap contribution with custom fresnel
    float matcapFactor = matcapFresnel(ray, normal) * u_matcapStrength;
    
    // Blend matcap with base color according to blend mode
    vec3 blendedColor = blendMatcap(baseColor, matcapColor, u_matcapBlendMode, matcapFactor);
    
    // Combine all effects
    vec3 finalColor = blendedColor + highlightColor + causticPattern + bubbles;
    
    // Apply Volume Absorption
    float distanceInMedium = totalDist * u_refractionDepth * 0.1;
    vec3 absorptionFactor = exp(-u_absorptionColor * u_absorptionDensity * distanceInMedium);
    finalColor *= absorptionFactor;
    
    // Add internal details with animation - use smoother time
    float timeFactorInternal = u_time * 0.05;
    float internalPattern = sin(rayPos.x * 20.0 + timeFactorInternal) * 
                            sin(rayPos.y * 20.0 + timeFactorInternal * 1.2) * 
                            u_internalPatternIntensity;
    finalColor += internalPattern;
    
    // Mix with background based on opacity
    outgoing = mix(tex, vec4(finalColor, 1.0), clamp(u_opacity, 0.0, 1.0));
  }
  
  gl_FragColor = outgoing;
}