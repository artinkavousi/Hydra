//---------------------------------------------------------
// This function is based on the Inigo Quilez article.
// https://iquilezles.org/articles/distfunctions/
//---------------------------------------------------------

float sdSphere( vec3 p, float s ) {
  return length(p)-s;
}

float sdBox( vec3 p, vec3 b ) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// Dodecahedron SDF (Inigo Quilez)
// https://iquilezles.org/articles/distfunctions/
float sdDodecahedron(vec3 p, float r) {
    const float PHI = 1.61803398875; // Golden ratio
    const vec3 n1 = normalize(vec3( 1,  1,  1));
    const vec3 n2 = normalize(vec3(-1,  1,  1));
    const vec3 n3 = normalize(vec3( 1, -1,  1));
    const vec3 n4 = normalize(vec3( 1,  1, -1));
    const vec3 n5 = normalize(vec3( 0,  PHI, 1.0/PHI));
    const vec3 n6 = normalize(vec3( 0, -PHI, 1.0/PHI));
    const vec3 n7 = normalize(vec3( 0,  PHI, -1.0/PHI));
    const vec3 n8 = normalize(vec3( 0, -PHI, -1.0/PHI));
    const vec3 n9 = normalize(vec3( 1.0/PHI, 0,  PHI));
    const vec3 n10= normalize(vec3(-1.0/PHI, 0,  PHI));
    const vec3 n11= normalize(vec3( 1.0/PHI, 0, -PHI));
    const vec3 n12= normalize(vec3(-1.0/PHI, 0, -PHI));
    const vec3 n13= normalize(vec3( PHI, 1.0/PHI, 0));
    const vec3 n14= normalize(vec3(-PHI, 1.0/PHI, 0));
    const vec3 n15= normalize(vec3( PHI, -1.0/PHI, 0));
    const vec3 n16= normalize(vec3(-PHI, -1.0/PHI, 0));
    float d = -1e10;
    d = max(d, dot(p, n1));
    d = max(d, dot(p, n2));
    d = max(d, dot(p, n3));
    d = max(d, dot(p, n4));
    d = max(d, dot(p, n5));
    d = max(d, dot(p, n6));
    d = max(d, dot(p, n7));
    d = max(d, dot(p, n8));
    d = max(d, dot(p, n9));
    d = max(d, dot(p, n10));
    d = max(d, dot(p, n11));
    d = max(d, dot(p, n12));
    d = max(d, dot(p, n13));
    d = max(d, dot(p, n14));
    d = max(d, dot(p, n15));
    d = max(d, dot(p, n16));
    float edgeSoftness = 0.01;
    return max(d - r, length(p) - (r + edgeSoftness));
}