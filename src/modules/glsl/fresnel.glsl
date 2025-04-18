uniform float u_fresnelBaseReflectivity;

float fresnel(vec3 eye, vec3 normal) {
  // Schlick's approximation for Fresnel
  float F0 = u_fresnelBaseReflectivity;
  float cosTheta = max(dot(eye, normal), 0.0);
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}