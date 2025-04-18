// AMOUNT replaces at call position

#define PI 3.14159265359 // Define PI globally at the top

struct Data {
  vec3 position;
  float scale;
};

uniform float u_aspect;
uniform Data u_datas[AMOUNT];
uniform samplerCube u_envMap;
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
uniform bool u_matcapEnabled; // Declare u_matcapEnabled

// --- Add Audio Reactive Uniforms ---
uniform float u_audioLevel;
uniform float u_audioLow;
uniform float u_audioMid;
uniform float u_audioHigh;
// Add controls
uniform bool u_audioReactiveEnabled;
uniform float u_audioSurfaceDistortionStrength;
uniform float u_audioCausticIntensityStrength;
uniform float u_audioBubbleMovementStrength;
uniform float u_audioRimLightIntensityStrength;
// --- Add new strength uniforms ---
uniform float u_audioSurfaceDistortionFreqStrength;
uniform float u_audioIridescenceStrength;
uniform float u_audioIridescenceFreqStrength;
uniform float u_audioCausticScaleStrength;
uniform float u_audioCausticSpeedStrength;
uniform float u_audioBubbleDensityStrength;
uniform float u_audioBubbleSizeStrength;
uniform float u_audioRimWidthStrength;
uniform float u_audioInternalPatternStrength;
uniform float u_audioInternalPatternSpeedStrength;
// --- Ferrofluid uniforms ---
uniform float u_ferroSdfSharpnessStrength;
// --- Enhancement Uniforms ---
uniform float u_refractionBlurStrength;
uniform float u_beatIridescenceFlash;
// --- Bass Impact ---
uniform float u_audioBassImpact;
uniform float u_audioBassImpactSplashStrength;
// --- End Audio Uniforms ---

uniform bool u_dofEnabled;
uniform float u_focusDistance;
uniform float u_aperture;
uniform int u_dofSamples;
// Add camera & matrix uniforms for perspective raymarching
uniform vec3 u_cameraPosition;
uniform mat4 viewMatrixInverse;
uniform mat4 projectionMatrixInverse;

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
float cellular(vec3 p, float densityFactor) {
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  
  float d = 1.0;

  // Modulate bubble animation speed with audio level
  float reactiveBubbleSpeed = u_bubbleSpeed * (1.0 + (u_audioReactiveEnabled ? u_audioLevel * 0.5 : 0.0));
  float bubbleTime = u_time * reactiveBubbleSpeed * 0.5;
  
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      for (int k = -1; k <= 1; k++) {
        vec3 offset = vec3(float(i), float(j), float(k));
        // Add audio reactivity to bubble seed points (low frequency)
        float audioInfluence = u_audioReactiveEnabled ? u_audioLow * u_audioBubbleMovementStrength : 0.0;
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
  
  // Modulate bubble size with overall audio level
  float reactiveBubbleSize = u_bubbleSize * (1.0 + (u_audioReactiveEnabled ? u_audioLevel * u_audioBubbleSizeStrength : 0.0));
  // Use densityFactor to influence the threshold
  return 1.0 - smoothstep(0.0, 0.2 * reactiveBubbleSize * (1.0 / max(0.1, densityFactor * 2.0)), d);
}

// Function to generate iridescent colors
vec3 calculateIridescence(vec3 normal, vec3 viewDir) {
  // Calculate the angle between the normal and view direction
  float cosAngle = abs(dot(normalize(normal), normalize(viewDir)));
  
  // Modulate iridescence frequency with mid audio
  float reactiveIridescenceFreq = u_iridescenceFrequency * (1.0 + (u_audioReactiveEnabled ? u_audioMid * u_audioIridescenceFreqStrength : 0.0));
  
  // Transform the angle to create color shift - make time influence smoother
  float timeFactor = sin(u_time * 0.05);
  float colorShift = cosAngle * reactiveIridescenceFreq + timeFactor;
  
  // Generate rainbow colors
  vec3 iridescence;
  iridescence.r = 0.5 + 0.5 * sin(colorShift);
  iridescence.g = 0.5 + 0.5 * sin(colorShift + 2.094); // 2.094 = 2π/3
  iridescence.b = 0.5 + 0.5 * sin(colorShift + 4.188); // 4.188 = 4π/3
  
  // Modulate overall iridescence visibility with high audio
  float strength = u_iridescenceStrength * (1.0 + (u_audioReactiveEnabled ? u_audioHigh * u_audioIridescenceStrength : 0.0));
  
  // Calculate flash boost based on bass impact and flash strength parameter
  float beatFlashBoost = u_audioReactiveEnabled ? u_audioBassImpact * u_beatIridescenceFlash : 0.0;
  strength += beatFlashBoost; // Add the flash boost directly to strength
  
  return iridescence * clamp(strength, 0.0, 5.0); // Clamp strength to avoid excessive brightness
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

// Define the Signed Distance Function (SDF) for the scene
float sdf(vec3 p) {
  vec3 correct = vec3(u_aspect, 1.0, 1.0) * vec3(0.08, 0.15, 0.2);

  // Add subtle time-based movement to the droplets (Keep this base movement)
  vec3 timeOffset = vec3(
    sin(u_time * 0.2) * 0.01,
    cos(u_time * 0.3) * 0.01,
    0.0
  );

  // Calculate beat effect strength
  float beatEffect = u_audioReactiveEnabled ? u_audioBassImpact * u_audioBassImpactSplashStrength : 0.0;
  // Calculate a temporary scale multiplier for the splash effect
  float beatScaleMultiplier = 1.0 + beatEffect * 0.5; // Example: Increase scale by up to 50% during impact

  vec3 pos0 = p + -(u_datas[0].position + timeOffset) * correct;
  float final = sdSphere(pos0, 0.2 * u_datas[0].scale * beatScaleMultiplier); // Apply beat scale multiplier

  // Calculate reactive SDF merge sharpness based on Highs AND the new Bass Impact
  float baseSmoothness = 0.4;
  float sharpnessBoostHighs = u_audioReactiveEnabled ? u_audioHigh * u_ferroSdfSharpnessStrength : 0.0;
  // Make smoothness inversely proportional to bass impact strength (lower = sharper)
  float beatSharpnessBoost = beatEffect; // Directly use the scaled impact
  
  // Combine sharpness boosts (maybe cap or use max? Using sum for now)
  float totalSharpnessBoost = sharpnessBoostHighs + beatSharpnessBoost;

  // Calculate final smoothness, clamping to avoid zero or negative values
  float reactiveSmoothness = max(0.01, baseSmoothness * (1.0 - clamp(totalSharpnessBoost, 0.0, 0.95))); // Clamp boost

  for(int i = 1; i < COUNT; i++) {
    // Add unique subtle movement to each droplet (Keep this base movement)
    vec3 uniqueOffset = vec3(
      sin(u_time * 0.1 + float(i) * 0.5) * 0.01,
      cos(u_time * 0.15 + float(i) * 0.3) * 0.01,
      0.0
    );
    
    vec3 posI = p + -(u_datas[i].position + uniqueOffset) * correct;
    // --- Shape selection: Only spheres active, others commented for easy restoration ---
    float shapeSdf = sdSphere(posI, 0.15 * u_datas[i].scale * beatScaleMultiplier);
    /*
    // Uncomment to use boxes and dodecahedrons:
    if (mod(float(i), 3.0) < 1.0) {
      shapeSdf = sdSphere(posI, 0.15 * u_datas[i].scale * beatScaleMultiplier);
    } else if (mod(float(i), 3.0) < 2.0) {
      vec3 boxSize = vec3(0.12 * u_datas[i].scale * beatScaleMultiplier);
      shapeSdf = sdBox(posI, boxSize);
    } else {
      shapeSdf = sdDodecahedron(posI, 0.13 * u_datas[i].scale * beatScaleMultiplier);
    }
    */
    final = opSmoothUnion(final, shapeSdf, reactiveSmoothness);
  }

  return final;
}

#include './raymarching/normal.glsl'

// --- Move Hash Function Here ---
// Hash function for pseudo-random numbers
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
// --- End Moved Hash Function ---

// Perturb normal to create microscopic surface irregularities
vec3 perturbNormal(vec3 position, vec3 normal) {
  float reactiveScale = 30.0 * (1.0 + (u_audioReactiveEnabled ? u_audioLow * u_audioSurfaceDistortionFreqStrength * 0.5 : 0.0));
  float timeInfluence = sin(u_time * 0.05) * 0.5;
  float eps = 0.01;
  
  // Modulate distortion strength by roughness (less distortion when rough)
  float roughnessFactor = 1.0 - smoothstep(0.0, 1.0, u_surfaceRoughness); // Inverse relationship
  float baseDistortionStrength = u_surfaceDistortion * (1.0 + (u_audioReactiveEnabled ? u_audioMid * u_audioSurfaceDistortionStrength : 0.0));
  float distortionStrength = baseDistortionStrength * roughnessFactor;
  
  float nx = animatedNoise(position * reactiveScale + vec3(eps, 0.0, timeInfluence)) - animatedNoise(position * reactiveScale - vec3(eps, 0.0, timeInfluence));
  float ny = animatedNoise(position * reactiveScale + vec3(0.0, eps, timeInfluence)) - animatedNoise(position * reactiveScale - vec3(0.0, eps, timeInfluence));
  float nz = animatedNoise(position * reactiveScale + vec3(0.0, 0.0, eps + timeInfluence)) - animatedNoise(position * reactiveScale - vec3(0.0, 0.0, eps - timeInfluence));
  vec3 noiseVec = vec3(nx, ny, nz) * distortionStrength;
  return normalize(normal + noiseVec);
}

// Sample cube environment map
vec3 sampleEnvMap(vec3 dir) {
  return textureCube(u_envMap, normalize(dir)).rgb;
}

// New refraction function using refract() and env map sampling
vec3 calculateRefractionColor(vec3 viewDir, vec3 normal, vec2 uvSeed) {
    // Ensure IOR is not exactly 1.0 to avoid division by zero in refract's ratio
    float safeIOR = max(1.001, u_ior);
    float safeDispersion = max(0.0, u_dispersion); // Dispersion amount

    // Calculate IORs for R, G, B channels
    float etaR = 1.0 / (safeIOR - safeDispersion);
    float etaG = 1.0 / safeIOR;
    float etaB = 1.0 / (safeIOR + safeDispersion);

    // Calculate refracted vectors for each channel
    vec3 refractR = refract(viewDir, normal, etaR);
    vec3 refractG = refract(viewDir, normal, etaG);
    vec3 refractB = refract(viewDir, normal, etaB);
    // Normalize refraction depth to [0,1] and mix for adjustable thickness
    float depthStrength = clamp(u_refractionDepth / 3.0, 0.0, 1.0);
    refractR = normalize(mix(viewDir, refractR, depthStrength));
    refractG = normalize(mix(viewDir, refractG, depthStrength));
    refractB = normalize(mix(viewDir, refractB, depthStrength));

    // --- Refraction Blur ---
    // Use roughness and blur strength to perturb sample direction
    float blurAmount = u_surfaceRoughness * u_refractionBlurStrength * 0.01;
    // Generate a random offset based on screen UV and time for variation
    vec2 randomOffsetSeed = uvSeed + u_time * 0.01;
    vec3 randomVec = vec3(
        hash(randomOffsetSeed + vec2(0.1, 0.7)) - 0.5,
        hash(randomOffsetSeed + vec2(0.3, 0.9)) - 0.5,
        hash(randomOffsetSeed + vec2(0.5, 0.2)) - 0.5
    ) * 2.0; // Range -1 to 1

    vec3 blurOffset = normalize(randomVec) * blurAmount;

    // Apply blur only if refract didn't result in TIR (Total Internal Reflection)
    // refract() returns vec3(0.0) on TIR
    if (length(refractR) > 0.01) refractR = normalize(refractR + blurOffset);
    if (length(refractG) > 0.01) refractG = normalize(refractG + blurOffset * 0.9); // Slightly different blur
    if (length(refractB) > 0.01) refractB = normalize(refractB + blurOffset * 1.1);
    // --- End Refraction Blur ---


    // Sample environment map - Use reflection vector if TIR occurred
    vec3 reflectionVec = reflect(-viewDir, normal);   // Calculate reflection vector once

    // Pure refraction via environment cubemap (dispersion per channel)
    vec3 colorR = sampleEnvMap(refractR);
    vec3 colorG = sampleEnvMap(refractG);
    vec3 colorB = sampleEnvMap(refractB);
    // Combine R/G/B channels for dispersion
    vec3 primaryColor = vec3(colorR.r, colorG.g, colorB.b) * u_refractionStrength;
    vec3 resultColor = primaryColor;
    float secFactor = clamp(u_secondaryIOR, 0.0, 1.0);
    if (secFactor > 0.0) {
        float secondIOR = safeIOR + secFactor;
        float etaR2 = 1.0 / (secondIOR - safeDispersion);
        float etaG2 = 1.0 / secondIOR;
        float etaB2 = 1.0 / (secondIOR + safeDispersion);
        vec3 refractR2 = normalize(mix(viewDir, refract(viewDir, normal, etaR2), depthStrength));
        vec3 refractG2 = normalize(mix(viewDir, refract(viewDir, normal, etaG2), depthStrength));
        vec3 refractB2 = normalize(mix(viewDir, refract(viewDir, normal, etaB2), depthStrength));
        if (length(refractR2) > 0.01) refractR2 = normalize(refractR2 + blurOffset);
        if (length(refractG2) > 0.01) refractG2 = normalize(refractG2 + blurOffset * 0.9);
        if (length(refractB2) > 0.01) refractB2 = normalize(refractB2 + blurOffset * 1.1);
        vec3 colorR2 = sampleEnvMap(refractR2);
        vec3 colorG2 = sampleEnvMap(refractG2);
        vec3 colorB2 = sampleEnvMap(refractB2);
        vec3 secondaryColor = vec3(colorR2.r, colorG2.g, colorB2.b) * u_refractionStrength;
        resultColor = mix(primaryColor, secondaryColor, secFactor);
    }
    return resultColor;
}

// Calculate matcap UV coordinates based on the view and normal
vec2 calculateMatcapUV(vec3 normal, vec3 viewDir) {
  // Transform the normal to view space
  vec3 viewNormal = normalize(normal);
  
  // Calculate the reflection vector
  vec3 r = reflect(-viewDir, viewNormal);
  
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

// Function to trace a single ray and calculate color
vec4 traceRay(vec3 rayOrigin, vec3 rayDirection) {
  vec3 rayPos = rayOrigin;
  float totalDist = 0.0;
  // initialize volumetric attenuation
  vec3 attenuation = vec3(1.0);
  float tMax = 5.0;

  // Raymarching loop with volumetric absorption
  for(int i = 0; i < 192; i++) {
    float dist = sdf(rayPos);
    // accumulate absorption per step
    attenuation *= exp(-u_absorptionColor * u_absorptionDensity * dist);
    if (dist < 0.0001 || totalDist > tMax) break;
    totalDist += dist;
    rayPos = rayOrigin + totalDist * rayDirection;
  }

  // Use cube environment map for volumetric background
  vec3 envCol = sampleEnvMap(rayDirection);
  vec4 outgoing = vec4(envCol * attenuation, 1.0);

  if(totalDist < tMax) {
    vec3 normal = calcNormal(rayPos);
    
    // --- Surface Effects ---
    // Perturb normal for surface irregularities (reactive)
    normal = perturbNormal(rayPos, normal);
    // Add bump mapping (non-reactive for now)
    normal = bumpNormal(rayPos, normal);
    // --- End Surface Effects ---

    // --- Core Optics ---
    // Calculate fresnel for reflection/refraction mix (uses new uniform via fresnel.glsl)
    float f = fresnel(rayDirection, normal);
    
    // Calculate reflection color via spherical envMap
    vec3 reflectionColor = sampleEnvMap(reflect(-rayDirection, normal)) * u_reflectionStrength;

    // Calculate refraction color using the new function
    vec3 refractedColor = calculateRefractionColor(rayDirection, normal, v_uv);

    // Calculate iridescence (reactive)
    vec3 iridescenceColor = calculateIridescence(normal, rayDirection);
    // --- End Core Optics ---

    // --- Lighting & Material ---
    // Create rim lighting effect at edges (reactive)
    float reactiveRimIntensity = u_rimLightIntensity * (1.0 + (u_audioReactiveEnabled ? u_audioLevel * u_audioRimLightIntensityStrength : 0.0));
    float reactiveRimWidth = u_rimWidth * (1.0 + (u_audioReactiveEnabled ? u_audioHigh * u_audioRimWidthStrength : 0.0));
    float rim = pow(1.0 - abs(dot(rayDirection, normal)), reactiveRimWidth) * reactiveRimIntensity;
    vec3 highlightColor = u_rimColor * rim;

    // Add caustics effect (reactive)
    float reactiveCausticSpeed = u_causticSpeed * (1.0 + (u_audioReactiveEnabled ? u_audioLevel * u_audioCausticSpeedStrength : 0.0));
    float timeFactorCaustic = sin(u_time * reactiveCausticSpeed * 0.2);
    float reactiveCausticScale = u_causticScale * (1.0 + (u_audioReactiveEnabled ? u_audioHigh * u_audioCausticScaleStrength : 0.0));
    float reactiveCausticIntensity = u_causticIntensity * (1.0 + (u_audioReactiveEnabled ? u_audioHigh * u_audioCausticIntensityStrength : 0.0));
    float causticPattern = pow(
      sin(rayPos.x * reactiveCausticScale + rayPos.y * (reactiveCausticScale*0.6) + rayPos.z * (reactiveCausticScale*0.4) + timeFactorCaustic) * 0.5 + 0.5, 
      8.0
    ) * reactiveCausticIntensity;
    
    // Generate internal bubbles (reactive)
    float reactiveBubbleDensity = u_bubbleDensity * (1.0 + (u_audioReactiveEnabled ? u_audioMid * u_audioBubbleDensityStrength : 0.0));
    float bubbles = cellular(rayPos * 30.0, reactiveBubbleDensity) * reactiveBubbleDensity * 0.5;
    
    // Mix reflection and refraction based on fresnel
    vec3 baseColor = mix(refractedColor, reflectionColor, f);
    
    // Add iridescence effect (reactive) - Mix based on 1-fresnel
    baseColor = mix(baseColor, iridescenceColor, (1.0 - f) * u_iridescenceStrength); 
    
    // Apply glass tint
    baseColor *= u_glassTint;
    
    // Calculate matcap contribution if enabled
    vec3 finalBlendedColor = baseColor;
    if (u_matcapEnabled) {
        vec2 matcapUV = calculateMatcapUV(normal, rayDirection);
        vec3 matcapSample = texture2D(u_matcapTexture, matcapUV).rgb;
        float matcapFresnelFactor = matcapFresnel(rayDirection, normal);
        finalBlendedColor = blendMatcap(baseColor, matcapSample, u_matcapBlendMode, matcapFresnelFactor * u_matcapStrength);
    }
    
    // Combine all effects
    vec3 finalColor = finalBlendedColor + highlightColor + causticPattern + bubbles;
    
    // Apply volumetric attenuation and output
    outgoing = vec4(finalColor * attenuation, 1.0);
  }

  return outgoing;
}

// Generate random point on disk using concentric mapping
vec2 randomPointOnDisk(float radius, vec2 seed) {
  float r1 = hash(seed);
  float r2 = hash(seed + vec2(1.7, 3.9)); // Offset seed for second random number
  
  float r = radius * sqrt(r1); // Uniform distribution across disk area
  float theta = 2.0 * PI * r2;
  
  return vec2(r * cos(theta), r * sin(theta));
}

void main() {
  vec2 uvN = v_uv * 2.0 - 1.0;
  vec4 rayClip = vec4(uvN, -1.0, 1.0);
  vec4 rayEye = projectionMatrixInverse * rayClip;
  rayEye = vec4(rayEye.xy, -1.0, 0.0);
  vec3 centralRayDirection = normalize((viewMatrixInverse * rayEye).xyz);
  // Use provided cameraPosition uniform for ray origin
  vec3 camPos = u_cameraPosition;

  vec4 finalColor;

  // Check if DoF is enabled, aperture is positive, and samples are requested
  if (u_dofEnabled && u_aperture > 0.0 && u_dofSamples > 0) {
    vec3 focalPoint = camPos + centralRayDirection * u_focusDistance;
    vec3 totalColor = vec3(0.0);
    
    // Calculate camera orientation basis vectors (simplified for non-rotated camera)
    vec3 forward = normalize(centralRayDirection); // Should point towards view center
    // Ensure right vector is robust even if forward is aligned with up vector
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(worldUp, forward));
    // Handle edge case where forward is parallel to worldUp
    if (length(right) < 0.001) {
        right = normalize(cross(vec3(1.0, 0.0, 0.0), forward)); // Use world X axis if needed
    }
    vec3 up = normalize(cross(forward, right));

    float numSamples = float(u_dofSamples); // Convert int to float for division

    for (int i = 0; i < u_dofSamples; ++i) {
      // Generate random offset on the aperture disk plane
      // Use v_uv + i to ensure different random numbers per sample and per pixel
      vec2 diskOffset = randomPointOnDisk(u_aperture, v_uv + float(i)); 
      
      // Calculate the origin point for this sample ray on the virtual lens
      vec3 aperturePoint = camPos + right * diskOffset.x + up * diskOffset.y;
      
      // Calculate new ray direction from the aperture point towards the focal point
      vec3 dofRayDirection = normalize(focalPoint - aperturePoint);
      
      // Trace the ray for this sample and accumulate color
      totalColor += traceRay(aperturePoint, dofRayDirection).rgb;
    }
    
    // Average the color over all samples
    finalColor = vec4(totalColor / numSamples, 1.0);

  } else {
    // Trace a single ray from the camera center if DoF is disabled
    finalColor = traceRay(camPos, centralRayDirection);
  }
  
  vec3 gammaColor = pow(finalColor.rgb, vec3(1.0 / 2.2));
  gl_FragColor = vec4(gammaColor, u_opacity);
}