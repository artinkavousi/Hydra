import * as THREE from 'three';
import { Data } from '../types/types';

export const AMOUNT = 20

export const datas: Data[] = [...Array(AMOUNT)].map(() => {
	const position = new THREE.Vector3(THREE.MathUtils.randFloat(-5, 5), THREE.MathUtils.randFloat(-5, 5), 0)
	const scale = THREE.MathUtils.randFloat(0.5, 1.5)
	return { position, scale }
})

// Define material names as a type to help with type checking
export type MaterialName = 'Water' | 'Ice' | 'Glass' | 'Crystal' | 'Diamond' | 'Emerald' | 'Sapphire' | 'Amber' | 'Custom';

// Define matcap texture names as a type
export type MatcapTextureName = 
	| '5cad3098d01a8d232b753acad6f39972.jpg'
	| '93e1bbcf77ece0c0f7fc79ecb8ff0d00.jpg'
	| '944_large_remake2.jpg'
	| 'bluew.jpg'
	| 'bluew2.jpg'
	| 'blu_green_litsphere_by_jujikabane.jpg'
	| 'daphz1.jpg'
	| 'daphz2.jpg'
	| 'daphz3.jpg'
	| 'gooch.jpg'
	| 'jeepster_skinmat2.jpg'
	| 'JoshSingh_matcap.jpg'
	| 'LitSphere_example_2.jpg'
	| 'LitSphere_example_3.jpg'
	| 'LitSphere_example_4.jpg'
	| 'LitSphere_example_5.jpg'
	| 'LitSphere_test_02.jpg'
	| 'LitSphere_test_03.jpg'
	| 'LitSphere_test_04.jpg'
	| 'LitSphere_test_05.jpg'
	| 'matball01.jpg'
	| 'matball02.jpg'
	| 'matball03.jpg'
	| 'matball04.jpg'
	| 'matball05.jpg'
	| 'matball06.jpg'
	| 'matball07.jpg'
	| 'mydarkgreymetal_zbrush_matcap_by_digitalinkrod.jpg'
	| 'mygreenshinmetal_zbrush_matcap_by_digitalinkrod.jpg'
	| 'myredmetal_zbrush_matcap_by_digitalinkrod.jpg'
	| 'redsphere.jpg'
	| 'scooby_skin_mix.jpg'
	| 'smoothmat.jpg'
	| 'TwilightFisheye.jpg';

// IOR reference values for different materials
export const materialIORs: Record<MaterialName, number> = {
	'Water': 1.33,
	'Ice': 1.31,
	'Glass': 1.45,
	'Crystal': 1.52,
	'Diamond': 2.42,
	'Emerald': 1.57,
	'Sapphire': 1.76,
	'Amber': 1.55,
	'Custom': 1.45
};

// Parameters for glass-like properties
export const glassParameters = {
	// Optical properties
	ior: 1.45,                    // Index of refraction
	iorMaterial: 'Glass' as MaterialName, // Selected material (for presets)
	dispersion: 0.02,             // Chromatic aberration strength
	reflectionStrength: 0.3,      // Reflection intensity
	refractionStrength: 0.9,      // Refraction intensity
	refractionDepth: 1.0,         // How deep the refraction penetrates
	secondaryIOR: 0.2,            // Secondary refraction effect (birefringence)
	
	// Surface properties
	surfaceDistortion: 0.03,      // Surface irregularities strength
	surfaceRoughness: 0.5,        // Surface roughness/smoothness
	bumpScale: 0.02,              // Bump mapping intensity
	
	// Iridescence properties
	iridescenceStrength: 0.2,     // Strength of iridescent effect
	iridescenceFrequency: 3.0,    // Frequency of color change in iridescence
	
	// Visual effects
	causticIntensity: 0.15,       // Intensity of caustic patterns
	internalPatternIntensity: 0.03, // Intensity of internal details
	rimLightIntensity: 0.5,       // Edge highlight intensity
	bubbleDensity: 0.05,          // Density of internal bubbles/impurities
	// New Visual Effect Parameters
	causticSpeed: 0.5,            // Speed of caustic animation
	causticScale: 30.0,           // Scale/frequency of caustic pattern
	bubbleSpeed: 0.1,             // Speed of bubble animation/drift
	bubbleSize: 0.5,              // Relative size of bubbles
	rimColor: new THREE.Color(1.0, 1.0, 1.0), // Color of the rim light
	rimWidth: 4.0,               // Width/falloff power of the rim light

	// Color properties
	glassTint: new THREE.Color(0.95, 0.98, 1.0), // Slight blue-green tint
	opacity: 0.9,                // Overall transparency
	// New Volume Absorption Properties
	absorptionColor: new THREE.Color(0.8, 0.9, 1.0), // Color absorbed by the volume
	absorptionDensity: 0.1,       // Density factor for absorption

	// Matcap texture properties
	matcapTexture: 'bluew.jpg' as MatcapTextureName, // Default to blue water-like matcap
	matcapStrength: 0.5,         // Strength of matcap effect
	matcapBlendMode: 0,          // Blend mode: 0=normal, 1=add, 2=multiply
	matcapFresnelBias: 0.1,      // Fresnel bias for matcap
	matcapFresnelScale: 0.8,     // Fresnel scale for matcap
	matcapFresnelPower: 2.0,     // Fresnel power for matcap

	// --- Add Audio Reactive Parameters --- 
	audioLevel: 0.0,              // Overall normalized audio level (0-1)
	audioLow: 0.0,                // Normalized low frequency level (0-1)
	audioMid: 0.0,                // Normalized mid frequency level (0-1)
	audioHigh: 0.0                // Normalized high frequency level (0-1)
	// --- End Audio Parameters ---
}

// Function to sync the IOR value with the selected material
export function syncMaterialIOR() {
	const materialName = glassParameters.iorMaterial;
	
	// Check if it's a valid material name
	if (isMaterialName(materialName) && materialName !== 'Custom') {
		// Now TypeScript knows materialName is a valid key
		glassParameters.ior = materialIORs[materialName];
		console.log(`[store] Synced IOR to ${glassParameters.ior} from ${materialName}`);
		return true;
	}
	return false;
}

// Type guard to check if a string is a valid material name
function isMaterialName(name: string): name is MaterialName {
	return name in materialIORs;
}

// Initialize the IOR based on the default material
syncMaterialIOR();
