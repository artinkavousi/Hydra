import * as THREE from 'three';
import { Data } from '../types/types';

export const AMOUNT = 52

export const datas: Data[] = [...Array(AMOUNT)].map((_, i) => {
	const position = new THREE.Vector3(THREE.MathUtils.randFloat(-5, 5), THREE.MathUtils.randFloat(-5, 5), 0)
	const scale = THREE.MathUtils.randFloat(0.18, 0.85)
	// Spread blobs across FFT bins 30–180 (skip more low bins)
	const minBin = 80;
	const maxBin = 200;
	const frequencyBin = Math.round(minBin + (i / (AMOUNT - 1)) * (maxBin - minBin));
	return { position, scale, frequencyBin }
})

// Define Matcap texture names/paths
export const matcapTexturesList = {
	'5cad3098d01a8d232b753acad6f39972.jpg': '5cad3098d01a8d232b753acad6f39972.jpg',
	'93e1bbcf77ece0c0f7fc79ecb8ff0d00.jpg': '93e1bbcf77ece0c0f7fc79ecb8ff0d00.jpg',
	'944_large_remake2.jpg': '944_large_remake2.jpg',
	'bluew.jpg': 'bluew.jpg',
	'bluew2.jpg': 'bluew2.jpg',
	'blu_green_litsphere_by_jujikabane.jpg': 'blu_green_litsphere_by_jujikabane.jpg',
	'daphz1.jpg': 'daphz1.jpg',
	'daphz2.jpg': 'daphz2.jpg',
	'daphz3.jpg': 'daphz3.jpg',
	'gooch.jpg': 'gooch.jpg',
	'jeepster_skinmat2.jpg': 'jeepster_skinmat2.jpg',
	'JoshSingh_matcap.jpg': 'JoshSingh_matcap.jpg',
	'LitSphere_example_2.jpg': 'LitSphere_example_2.jpg',
	'LitSphere_example_3.jpg': 'LitSphere_example_3.jpg',
	'LitSphere_example_4.jpg': 'LitSphere_example_4.jpg',
	'LitSphere_example_5.jpg': 'LitSphere_example_5.jpg',
	'LitSphere_test_02.jpg': 'LitSphere_test_02.jpg',
	'LitSphere_test_03.jpg': 'LitSphere_test_03.jpg',
	'LitSphere_test_04.jpg': 'LitSphere_test_04.jpg',
	'LitSphere_test_05.jpg': 'LitSphere_test_05.jpg',
	'matball01.jpg': 'matball01.jpg',
	'matball02.jpg': 'matball02.jpg',
	'matball03.jpg': 'matball03.jpg',
	'matball04.jpg': 'matball04.jpg',
	'matball05.jpg': 'matball05.jpg',
	'matball06.jpg': 'matball06.jpg',
	'matball07.jpg': 'matball07.jpg',
	'mydarkgreymetal_zbrush_matcap_by_digitalinkrod.jpg': 'mydarkgreymetal_zbrush_matcap_by_digitalinkrod.jpg',
	'mygreenshinmetal_zbrush_matcap_by_digitalinkrod.jpg': 'mygreenshinmetal_zbrush_matcap_by_digitalinkrod.jpg',
	'myredmetal_zbrush_matcap_by_digitalinkrod.jpg': 'myredmetal_zbrush_matcap_by_digitalinkrod.jpg',
	'redsphere.jpg': 'redsphere.jpg',
	'scooby_skin_mix.jpg': 'scooby_skin_mix.jpg',
	'smoothmat.jpg': 'smoothmat.jpg',
	'TwilightFisheye.jpg': 'TwilightFisheye.jpg'
};
export type MatcapTextureName = keyof typeof matcapTexturesList;

// Define material names as a type to help with type checking
export const materialIORs = {
	'Water': 1.333,
	'Ice': 1.309,
	'Glass': 1.52,
	'Crystal': 2.0,
	'Diamond': 2.417,
	'Emerald': 1.577,
	'Sapphire': 1.762,
	'Amber': 1.55,
	'Custom': 1.45 // Default custom value
};
export type MaterialName = keyof typeof materialIORs;

// Parameters for glass-like properties
export const glassParameters = {
	// Optical properties
	ior: 1.52,
	iorMaterial: 'Custom' as MaterialName,
	dispersion: 0.015,
	reflectionStrength: 0.6,
	refractionStrength: 0.9,
	refractionDepth: 1.5,
	secondaryIOR: 0.0,
	opacity: 1.0,
	// Surface properties
	surfaceDistortion: 0.0,
	surfaceRoughness: 0.0,
	bumpScale: 0.0,
	// Iridescence properties
	iridescenceStrength: 0.0,
	iridescenceFrequency: 0.0,
	// Caustics properties
	causticIntensity: 0.0,
	causticScale: 0.0,
	causticSpeed: 0.0,
	// Bubbles properties
	bubbleDensity: 0.0,
	bubbleSpeed: 0.0,
	bubbleSize: 0.0,
	// Rim Light properties
	rimLightIntensity: 0.81,
	rimWidth: 10.0,
	rimColor: new THREE.Color('#fafafa'),
	// Internal Pattern properties
	internalPatternIntensity: 0.2,
	// Color properties
	glassTint: new THREE.Color('#ffffff'),
	absorptionColor: new THREE.Color('#0400d6'),
	absorptionDensity: 0.0,
	// Matcap texture properties
	matcapTexture: 'blu_green_litsphere_by_jujikabane.jpg' as MatcapTextureName,
	matcapStrength: 1.0,
	matcapBlendMode: 1,
	matcapFresnelBias: 1.0,
	matcapFresnelScale: 0.8,
	matcapFresnelPower: 0.5,
	matcapEnabled: true,
	// --- Audio Reactive Parameters --- 
	audioLevel: 0.0,
	audioLow: 0.0,
	audioMid: 0.0,
	audioHigh: 0.0,
	audioBassImpact: 0.0,
	audioReactiveEnabled: true,
	audioSurfaceDistortionStrength: 4.5,
	audioSurfaceDistortionFreqStrength: 3.9,
	audioIridescenceStrength: 0.0,
	audioIridescenceFreqStrength: 0.0,
	audioCausticIntensityStrength: 0.0,
	audioCausticScaleStrength: 0.0,
	audioCausticSpeedStrength: 0.0,
	audioBubbleMovementStrength: 0.0,
	audioBubbleDensityStrength: 0.0,
	audioBubbleSizeStrength: 0.0,
	audioRimLightIntensityStrength: 1.10,
	audioRimWidthStrength: 0.0,
	audioInternalPatternStrength: 0.85,
	audioInternalPatternSpeedStrength: 2.0,
	// --- Audio Mid Band Shaping ---
	audioMidCurve: 0.96,
	audioMidAmp: 1.80,
	audioMidEasing: [0.42, 0, 0.58, 1], // Default cubic-bezier
	ferroDropletMoveStrength: 150.0,
	ferroDropletScalePulseStrength: 0.55,
	ferroSdfSharpnessStrength: 1.50,
	ferroOscillationBaseFreqX: 4.2,
	ferroOscillationBaseFreqY: 3.6,
	refractionBlurStrength: 0.1,
	beatIridescenceFlash: 0.0,
	fresnelBaseReflectivity: 0.4,
	audioBassImpactSplashStrength: 0.0,
	dofEnabled: false,
	dofFocusDistance: 10.0,
	dofFocalLength: 25.0,
	dofBokehScale: 2.0,
	aperture: 0.02,
	dofSamples: 8,
	// --- Enhanced Audio Reactivity Parameters ---
	audioReactivitySyncStrength: 2.00,
	audioBeatDanceStyle: 2.00,
	audioHighFreqJitterStrength: 0.24,
	audioBassRippleSpeed: 2.61,
	audioMidFreqSwayStrength: 0.50,
	audioBeatSpeedUpAmount: 0.73,
	audioPulseAttackSpeed: 0.61,
	audioPulseDecaySpeed: 0.90,
	audioReactiveColorEnabled: false,
	audioBeatZoom: 0.12,
	// --- Particle System Parameters ---
	particleCount: 3000,
	particleSize: 0.04,
	particleVolume: 15,
	particleColor: '#6688ff',
	particleColorVariation: 0.3,
	// --- Per-blob FFT data ---
	audioFFT: [] as number[],
	audioBlobEasing: 0.05,
};

// --- Default Preset Definitions ---

const defaultPresets: { [name: string]: StoredPreset } = {
	"Liquid Metal": {
		ior: 1.8, iorMaterial: 'Custom', dispersion: 0.01, reflectionStrength: 0.9, refractionStrength: 0.5,
		refractionDepth: 1.5, secondaryIOR: 0.1, opacity: 0.95, surfaceDistortion: 0.01, surfaceRoughness: 0.1,
		bumpScale: 0.0, iridescenceStrength: 0.0, iridescenceFrequency: 0.0, causticIntensity: 0.0,
		causticScale: 0.0, causticSpeed: 0.0, bubbleDensity: 0.0, bubbleSpeed: 0.0, bubbleSize: 0.0,
		rimLightIntensity: 0.6, rimWidth: 5.0, rimColor: '#ddddff', internalPatternIntensity: 0.02,
		glassTint: '#e0e5ff', absorptionColor: '#101020', absorptionDensity: 0.05,
		matcapTexture: '5cad3098d01a8d232b753acad6f39972.jpg', matcapStrength: 0.8, matcapBlendMode: 0,
		matcapFresnelBias: 0.5, matcapFresnelScale: 0.7, matcapFresnelPower: 1.5, matcapEnabled: true,
		audioReactiveEnabled: true, audioSurfaceDistortionStrength: 1.0, audioSurfaceDistortionFreqStrength: 0.2,
		audioIridescenceStrength: 0.0, audioIridescenceFreqStrength: 0.0, audioCausticIntensityStrength: 0.0,
		audioCausticScaleStrength: 0.0, audioCausticSpeedStrength: 0.0, audioBubbleMovementStrength: 0.0,
		audioBubbleDensityStrength: 0.0, audioBubbleSizeStrength: 0.0, audioRimLightIntensityStrength: 0.8,
		audioRimWidthStrength: 0.5, audioInternalPatternStrength: 0.5, audioInternalPatternSpeedStrength: 0.5,
		ferroDropletMoveStrength: 80.0, ferroDropletScalePulseStrength: 0.3, ferroSdfSharpnessStrength: 1.0,
		ferroOscillationBaseFreqX: 1.0, ferroOscillationBaseFreqY: 1.2, refractionBlurStrength: 0.2, beatIridescenceFlash: 0.0, fresnelBaseReflectivity: 0.05, audioBassImpact: 0.0, audioBassImpactSplashStrength: 1.0
	},
	"Crystal Bubbles": {
		ior: 1.6, iorMaterial: 'Crystal', dispersion: 0.05, reflectionStrength: 0.4, refractionStrength: 1.2,
		refractionDepth: 2.0, secondaryIOR: 0.3, opacity: 0.9, surfaceDistortion: 0.0, surfaceRoughness: 0.05,
		bumpScale: 0.01, iridescenceStrength: 0.0, iridescenceFrequency: 0.0, causticIntensity: 0.0,
		causticScale: 0.0, causticSpeed: 0.0, bubbleDensity: 0.0, bubbleSpeed: 0.0, bubbleSize: 0.0,
		rimLightIntensity: 0.4, rimWidth: 3.0, rimColor: '#ffffff', internalPatternIntensity: 0.01,
		glassTint: '#f0f8ff', absorptionColor: '#e0ffff', absorptionDensity: 0.02,
		matcapTexture: 'daphz1.jpg', matcapStrength: 0.6, matcapBlendMode: 0,
		matcapFresnelBias: 0.2, matcapFresnelScale: 0.9, matcapFresnelPower: 2.5, matcapEnabled: true,
		audioReactiveEnabled: true, audioSurfaceDistortionStrength: 0.2, audioSurfaceDistortionFreqStrength: 0.1,
		audioIridescenceStrength: 0.0, audioIridescenceFreqStrength: 0.0, audioCausticIntensityStrength: 0.0,
		audioCausticScaleStrength: 0.0, audioCausticSpeedStrength: 0.0, audioBubbleMovementStrength: 0.0,
		audioBubbleDensityStrength: 0.0, audioBubbleSizeStrength: 0.0, audioRimLightIntensityStrength: 0.6,
		audioRimWidthStrength: 0.3, audioInternalPatternStrength: 0.2, audioInternalPatternSpeedStrength: 0.3,
		ferroDropletMoveStrength: 40.0, ferroDropletScalePulseStrength: 0.6, ferroSdfSharpnessStrength: 0.5,
		ferroOscillationBaseFreqX: 1.5, ferroOscillationBaseFreqY: 1.5, refractionBlurStrength: 0.1, beatIridescenceFlash: 0.0, fresnelBaseReflectivity: 0.08, audioBassImpact: 0.0, audioBassImpactSplashStrength: 1.2
	},
	"Neon Plasma": {
		ior: 1.33, iorMaterial: 'Water', dispersion: 0.1, reflectionStrength: 0.2, refractionStrength: 1.0,
		refractionDepth: 1.0, secondaryIOR: 0.0, opacity: 0.85, surfaceDistortion: 0.05, surfaceRoughness: 0.2,
		bumpScale: 0.0, iridescenceStrength: 0.0, iridescenceFrequency: 0.0, causticIntensity: 0.0,
		causticScale: 0.0, causticSpeed: 0.0, bubbleDensity: 0.02, bubbleSpeed: 0.2, bubbleSize: 0.4,
		rimLightIntensity: 1.0, rimWidth: 8.0, rimColor: '#ff00ff', internalPatternIntensity: 0.05,
		glassTint: '#ffeeff', absorptionColor: '#1a001a', absorptionDensity: 0.0,
		matcapTexture: 'gooch.jpg', matcapStrength: 0.7, matcapBlendMode: 1,
		matcapFresnelBias: 0.1, matcapFresnelScale: 1.0, matcapFresnelPower: 1.0, matcapEnabled: true,
		audioReactiveEnabled: true, audioSurfaceDistortionStrength: 2.0, audioSurfaceDistortionFreqStrength: 1.0,
		audioIridescenceStrength: 0.0, audioIridescenceFreqStrength: 0.0, audioCausticIntensityStrength: 0.0,
		audioCausticScaleStrength: 0.0, audioCausticSpeedStrength: 0.0, audioBubbleMovementStrength: 0.0,
		audioBubbleDensityStrength: 0.0, audioBubbleSizeStrength: 0.0, audioRimLightIntensityStrength: 2.0,
		audioRimWidthStrength: 2.5, audioInternalPatternStrength: 1.5, audioInternalPatternSpeedStrength: 1.5,
		ferroDropletMoveStrength: 120.0, ferroDropletScalePulseStrength: 1.0, ferroSdfSharpnessStrength: 1.2,
		ferroOscillationBaseFreqX: 2.5, ferroOscillationBaseFreqY: 2.0, refractionBlurStrength: 0.4, beatIridescenceFlash: 0.0, fresnelBaseReflectivity: 0.02, audioBassImpact: 0.0, audioBassImpactSplashStrength: 1.5
	},
	"Ghostly Fluid": {
		ior: 1.4, iorMaterial: 'Custom', dispersion: 0.005, reflectionStrength: 0.1, refractionStrength: 0.8,
		refractionDepth: 1.2, secondaryIOR: 0.05, opacity: 0.75, surfaceDistortion: 0.02, surfaceRoughness: 0.6,
		bumpScale: 0.0, iridescenceStrength: 0.0, iridescenceFrequency: 0.0, causticIntensity: 0.0,
		causticScale: 0.0, causticSpeed: 0.0, bubbleDensity: 0.0, bubbleSpeed: 0.0, bubbleSize: 0.0,
		rimLightIntensity: 0.2, rimWidth: 6.0, rimColor: '#ccffff', internalPatternIntensity: 0.04,
		glassTint: '#e0ffff', absorptionColor: '#001111', absorptionDensity: 0.1,
		matcapTexture: 'bluew.jpg', matcapStrength: 0.9, matcapBlendMode: 2,
		matcapFresnelBias: 0.3, matcapFresnelScale: 0.6, matcapFresnelPower: 3.0, matcapEnabled: false,
		audioReactiveEnabled: true, audioSurfaceDistortionStrength: 0.5, audioSurfaceDistortionFreqStrength: 0.05,
		audioIridescenceStrength: 0.0, audioIridescenceFreqStrength: 0.0, audioCausticIntensityStrength: 0.0,
		audioCausticScaleStrength: 0.0, audioCausticSpeedStrength: 0.0, audioBubbleMovementStrength: 0.0,
		audioBubbleDensityStrength: 0.0, audioBubbleSizeStrength: 0.0, audioRimLightIntensityStrength: 0.3,
		audioRimWidthStrength: 0.1, audioInternalPatternStrength: 0.3, audioInternalPatternSpeedStrength: 0.2,
		ferroDropletMoveStrength: 20.0, ferroDropletScalePulseStrength: 0.1, ferroSdfSharpnessStrength: 0.2,
		ferroOscillationBaseFreqX: 0.8, ferroOscillationBaseFreqY: 0.8, refractionBlurStrength: 0.8, beatIridescenceFlash: 0.0, fresnelBaseReflectivity: 0.03, audioBassImpact: 0.0, audioBassImpactSplashStrength: 0.8
	},
    // Add more presets as needed...
    "Emerald Gem": {
        ior: 1.57, iorMaterial: 'Emerald', dispersion: 0.06, reflectionStrength: 0.4, refractionStrength: 1.3,
        refractionDepth: 2.0, secondaryIOR: 0.1, opacity: 0.92, surfaceDistortion: 0.0, surfaceRoughness: 0.02,
        bumpScale: 0.01, iridescenceStrength: 0.0, iridescenceFrequency: 0.0, causticIntensity: 0.0,
        causticScale: 0.0, causticSpeed: 0.0, bubbleDensity: 0.0, bubbleSpeed: 0.0, bubbleSize: 0.0,
        rimLightIntensity: 0.4, rimWidth: 3.0, rimColor: '#baffc9', internalPatternIntensity: 0.01,
        glassTint: '#1be47a', absorptionColor: '#0a3c1a', absorptionDensity: 0.08,
        matcapTexture: 'blu_green_litsphere_by_jujikabane.jpg', matcapStrength: 0.7, matcapBlendMode: 0,
        matcapFresnelBias: 5.0, matcapFresnelScale: 2.8, matcapFresnelPower: 2.0, matcapEnabled: true
    }
};

// --- Preset Management (using localStorage) ---

const PRESET_STORAGE_KEY = 'r3fWaterDropsPresets';

// Type for stored presets (excluding functions/complex objects if needed, but store everything for now)
type StoredPreset = Partial<Omit<typeof glassParameters, 'rimColor' | 'glassTint' | 'absorptionColor'>> & {
    rimColor?: string | number; // Store colors as hex strings/numbers
    glassTint?: string | number;
    absorptionColor?: string | number;
    // Add other potentially non-serializable types if needed
};

export const getPresets = (): { [name: string]: StoredPreset } => {
	try {
		const stored = localStorage.getItem(PRESET_STORAGE_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch (error) {
		console.error("Failed to load presets:", error);
		return {};
	}
};

// Modified savePreset to accept StoredPreset directly for initialization
export const savePreset = (name: string, parameters: typeof glassParameters | StoredPreset): boolean => {
	if (!name) return false;
	try {
		const presets = getPresets();
		// Simple serialization: Convert Colors to hex strings if not already strings
		const serializedParams: any = {};
		Object.entries(parameters).forEach(([key, value]) => {
			if (value instanceof THREE.Color) {
				serializedParams[key] = '#' + value.getHexString();
			} else if (typeof value === 'string' && value.startsWith('#')) {
				// Already serialized color string from default preset definition
				serializedParams[key] = value;
			} else {
				serializedParams[key] = value;
			}
		});
		presets[name] = serializedParams;
		localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
		console.log(`Preset '${name}' saved.`);
		return true;
	} catch (error) {
		console.error(`Failed to save preset '${name}':`, error);
		return false;
	}
};

export const loadPreset = (name: string): boolean => {
	try {
		const presets = getPresets();
		if (!presets[name]) {
			console.warn(`Preset '${name}' not found.`);
			return false;
		}
		const presetParams = presets[name];
		Object.entries(presetParams).forEach(([key, value]) => {
			if (key in glassParameters) {
				const targetParam = glassParameters[key as keyof typeof glassParameters];
				// Handle Color deserialization
				if (targetParam instanceof THREE.Color && typeof value === 'string' && value.startsWith('#')) {
					targetParam.set(value);
				} else if (!(targetParam instanceof THREE.Color)) {
					// Assign other types directly
					(glassParameters as any)[key] = value;
				}
			}
		});
		console.log(`Preset '${name}' loaded.`);
		// Additionally sync IOR material if IOR was loaded
		if (presetParams.iorMaterial) {
			syncMaterialIOR(); // Ensure material name matches loaded IOR if possible
		}
		return true;
	} catch (error) {
		console.error("Failed to load preset:", error);
		return false;
	}
};

export const deletePreset = (name: string): boolean => {
	try {
		const presets = getPresets();
		if (!presets[name]) return false;
		delete presets[name];
		localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
		console.log(`Preset '${name}' deleted.`);
		return true;
	} catch (error) {
		console.error("Failed to delete preset:", error);
		return false;
	}
};

// Function to sync the IOR value with the selected material
export function syncMaterialIOR() {
	const materialName = glassParameters.iorMaterial;
	
	// Check if it's a valid material name
	if (isMaterialName(materialName) && materialName !== 'Custom') {
		// Now TypeScript knows materialName is a valid key
		glassParameters.ior = materialIORs[materialName];
		console.log(`[store] Synced IOR to ${glassParameters.ior} from ${materialName}`);
		return true;
	} else if (materialName === 'Custom') {
		// If set to custom, don't change the IOR value
		return true;
	}
	return false;
}

// Type guard to check if a string is a valid material name
function isMaterialName(name: string): name is MaterialName {
	return name in materialIORs;
}

// --- Initialize Default Presets --- 
function initializeDefaultPresets() {
	console.log("[Preset Init] Running initializeDefaultPresets...");
	const existingPresets = getPresets();
	console.log("[Preset Init] Existing presets found:", Object.keys(existingPresets));
	let presetsAdded = false;
	Object.entries(defaultPresets).forEach(([name, params]) => {
		if (!existingPresets[name]) {
			console.log(`[Preset Init] Attempting to save default preset: ${name}`);
			const saved = savePreset(name, params); // Check return value
			if (saved) {
				console.log(`[Preset Init] Successfully saved default preset: ${name}`);
				presetsAdded = true;
			} else {
				 console.error(`[Preset Init] FAILED to save default preset: ${name}`);
			}
		}
	});
	if (presetsAdded) {
		console.log("[Preset Init] Default presets initialization completed.");
	} else {
		console.log("[Preset Init] Default presets already exist or failed to save.");
	}
}

// Run initialization logic once when the module loads
initializeDefaultPresets();

// Initialize the IOR based on the current (possibly default) material
syncMaterialIOR();
