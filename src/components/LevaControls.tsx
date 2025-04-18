import { useControls, folder, button, buttonGroup, monitor } from 'leva';
import { useState, useEffect, FC } from 'react';
import * as THREE from 'three';
import {
    glassParameters, materialIORs, syncMaterialIOR, MaterialName, matcapTexturesList,
    MatcapTextureName,
    getPresets, savePreset, loadPreset, deletePreset
} from './audio/store';
import { audioAnalyser } from './audio/audio';

// Helper to create options object for leva select
const createOptions = (obj: object) => Object.keys(obj).reduce((acc, key) => ({ ...acc, [key]: key }), {});
const createValueMapOptions = (obj: { [key: string]: string }) => Object.keys(obj).reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});

export const LevaControls: FC = () => {
    // State to track presets from localStorage
    const [presets, setPresets] = useState(() => getPresets());
    // State to signal that leva controls need manual syncing after preset load
    const [needsLevaSync, setNeedsLevaSync] = useState(false);

    // Leva's useControls hook defines the panel structure and state
    // We pass `presets` as a dependency to make the dropdown rebuild when presets change
    const [levaValues, setLeva] = useControls(
        () => ({
        // --- Presets Folder ---
        Presets: folder({
            presetName: { label: 'Save Preset Name', value: '' }, // Transient input, not stored in glassParams
            selectedPreset: {
                label: 'Load/Delete Preset',
                options: { '-- Select Preset --': '-- Select Preset --', ...createOptions(presets) },
                value: '-- Select Preset --' // Start unselected
            },
            managePresets: buttonGroup({
                label: ' ', // Button group label (optional)
                opts: {
                    Save: () => {
                        const name = levaValues.presetName; // Get name from leva state
                        if (name) {
                            if (savePreset(name, glassParameters)) {
                                alert(`Preset '${name}' saved!`);
                                setPresets(getPresets()); // Update local state to trigger dropdown rebuild via dependency
                                setLeva({ selectedPreset: name, presetName: '' }); // Update leva's selected + clear name input
                            } else { alert('Failed to save preset.'); }
                        } else { alert('Please enter a preset name.'); }
                    },
                    Load: () => {
                        const name = levaValues.selectedPreset; // Get selected from leva state
                        if (name && name !== '-- Select Preset --') {
                            if (loadPreset(name)) {
                                alert(`Preset '${name}' loaded!`);
                                setNeedsLevaSync(true); // Signal that leva controls need manual update
                            } else { alert('Failed to load preset.'); }
                        } else { alert('Please select a preset to load.'); }
                    },
                    Delete: () => {
                        const name = levaValues.selectedPreset; // Get selected from leva state
                        if (name && name !== '-- Select Preset --') {
                            if (window.confirm(`Delete preset '${name}'?`)) {
                                if (deletePreset(name)) {
                                    alert(`Preset '${name}' deleted!`);
                                    setPresets(getPresets()); // Update local state
                                    setLeva({ selectedPreset: '-- Select Preset --' }); // Reset leva selection
                                } else { alert('Failed to delete preset.'); }
                            }
                        } else { alert('Please select a preset to delete.'); }
                    }
                }
            })
        }),

        // --- Optical Properties ---
        Optical: folder({
            iorMaterial: {
                label: 'Material Preset',
                options: createOptions(materialIORs),
                value: glassParameters.iorMaterial,
                onChange: (v) => {
                    glassParameters.iorMaterial = v as MaterialName;
                    syncMaterialIOR();
                }
            },
            ior: {
                label: 'IOR',
                value: glassParameters.ior, min: 1.0, max: 2.5, step: 0.01,
                onChange: (v) => {
                    glassParameters.ior = v;
                    glassParameters.iorMaterial = 'Custom'; // Keep underlying store in sync
                }
            },
            dispersion: { label: 'Dispersion', value: glassParameters.dispersion, min: 0.0, max: 0.1, step: 0.001, onChange: (v) => glassParameters.dispersion = v },
            reflectionStrength: { label: 'Reflection Str', value: glassParameters.reflectionStrength, min: 0.0, max: 1.0, step: 0.01, onChange: (v) => glassParameters.reflectionStrength = v },
            refractionStrength: { label: 'Refraction Str', value: glassParameters.refractionStrength, min: 0.0, max: 2.0, step: 0.01, onChange: (v) => glassParameters.refractionStrength = v },
            refractionDepth: { label: 'Refraction Depth', value: glassParameters.refractionDepth, min: 0.1, max: 3.0, step: 0.1, onChange: (v) => glassParameters.refractionDepth = v },
            secondaryIOR: { label: 'Birefringence', value: glassParameters.secondaryIOR, min: 0.0, max: 1.0, step: 0.01, onChange: (v) => glassParameters.secondaryIOR = v },
            opacity: { label: 'Transparency', value: glassParameters.opacity, min: 0.0, max: 1.0, step: 0.01, onChange: (v) => glassParameters.opacity = v },
            fresnelBaseReflectivity: {
                label: "Fresnel Reflectivity",
                value: glassParameters.fresnelBaseReflectivity,
                min: 0.0,
                max: 1.0,
                step: 0.01,
                onChange: (value) => { glassParameters.fresnelBaseReflectivity = value; },
            },
        }),

        // --- Surface Properties ---
        Surface: folder({
            surfaceDistortion: { label: 'Distortion Amt', value: glassParameters.surfaceDistortion, min: 0.0, max: 0.1, step: 0.001, onChange: (v) => glassParameters.surfaceDistortion = v },
            surfaceRoughness: { label: 'Roughness', value: glassParameters.surfaceRoughness, min: 0.0, max: 1.0, step: 0.01, onChange: (v) => glassParameters.surfaceRoughness = v },
            bumpScale: { label: 'Bump Scale', value: glassParameters.bumpScale, min: 0.0, max: 0.1, step: 0.001, onChange: (v) => glassParameters.bumpScale = v },
            refractionBlurStrength: { label: 'Refraction Blur', value: glassParameters.refractionBlurStrength, min: 0.0, max: 1.0, step: 0.05, onChange: (v) => glassParameters.refractionBlurStrength = v },
            distortStr: { label: 'Audio Distort Str (Mids)', value: glassParameters.audioSurfaceDistortionStrength, min: 0.0, max: 5.0, step: 0.1, onChange: (v) => glassParameters.audioSurfaceDistortionStrength = v },
            distortFreq: { label: 'Audio Distort Freq (Lows)', value: glassParameters.audioSurfaceDistortionFreqStrength, min: 0.0, max: 2.0, step: 0.05, onChange: (v) => glassParameters.audioSurfaceDistortionFreqStrength = v },
        }),

        // --- Rim Light ---
        "Rim Light": folder({
            rimInt: { label: 'Base Intensity', value: glassParameters.rimLightIntensity, min: 0.0, max: 1.0, step: 0.01, onChange: (v) => glassParameters.rimLightIntensity = v },
            rimWidth: { label: 'Base Width', value: glassParameters.rimWidth, min: 1.0, max: 10.0, step: 0.1, onChange: (v) => glassParameters.rimWidth = v },
            rimColor: { label: 'Color', value: '#' + glassParameters.rimColor.getHexString(), onChange: (v) => glassParameters.rimColor.set(v) },
            audioRimInt: { label: 'Audio Int (Level)', value: glassParameters.audioRimLightIntensityStrength, min: 0.0, max: 3.0, step: 0.05, onChange: (v) => glassParameters.audioRimLightIntensityStrength = v },
            audioRimWidth: { label: 'Audio Width (Highs)', value: glassParameters.audioRimWidthStrength, min: 0.0, max: 4.0, step: 0.1, onChange: (v) => glassParameters.audioRimWidthStrength = v },
        }),

        // --- Internal Pattern ---
        "Internal Pattern": folder({
            internalInt: { label: 'Base Intensity', value: glassParameters.internalPatternIntensity, min: 0.0, max: 0.1, step: 0.001, onChange: (v) => glassParameters.internalPatternIntensity = v },
            audioInternalStr: { label: 'Audio Str (Mids)', value: glassParameters.audioInternalPatternStrength, min: 0.0, max: 2.0, step: 0.05, onChange: (v) => glassParameters.audioInternalPatternStrength = v },
            audioInternalSpeed: { label: 'Audio Speed (Lows)', value: glassParameters.audioInternalPatternSpeedStrength, min: 0.0, max: 2.0, step: 0.05, onChange: (v) => glassParameters.audioInternalPatternSpeedStrength = v },
        }),

        // --- Color ---
        Color: folder({
            glassTint: { label: 'Glass Tint', value: '#' + glassParameters.glassTint.getHexString(), onChange: (v) => glassParameters.glassTint.set(v) },
            absorptionColor: { label: 'Absorption Color', value: '#' + glassParameters.absorptionColor.getHexString(), onChange: (v) => glassParameters.absorptionColor.set(v) },
            absorptionDensity: { label: 'Absorption Density', value: glassParameters.absorptionDensity, min: 0.0, max: 2.0, step: 0.01, onChange: (v) => glassParameters.absorptionDensity = v },
        }),

         // --- Matcap ---
         Matcap: folder({
             matcapTexture: {
                 label: 'Texture',
                 options: createValueMapOptions(matcapTexturesList), // Use helper for value map
                 value: glassParameters.matcapTexture,
                 onChange: (v) => glassParameters.matcapTexture = v as MatcapTextureName
             },
             matcapEnabled: { label: 'Enable Matcap', value: glassParameters.matcapEnabled, onChange: (v) => glassParameters.matcapEnabled = v },
             matcapStrength: { label: 'Strength', value: glassParameters.matcapStrength, min: 0.0, max: 1.0, step: 0.01, onChange: (v) => glassParameters.matcapStrength = v },
             matcapBlendMode: {
                 label: 'Blend Mode',
                 options: { Normal: 0, Add: 1, Multiply: 2 },
                 value: glassParameters.matcapBlendMode,
                 onChange: (v) => glassParameters.matcapBlendMode = v
             },
             matcapFresnelBias: { label: 'Fresnel Bias', value: glassParameters.matcapFresnelBias, min: 0.0, max: 1.0, step: 0.01, onChange: (v) => glassParameters.matcapFresnelBias = v },
             matcapFresnelScale: { label: 'Fresnel Scale', value: glassParameters.matcapFresnelScale, min: 0.0, max: 1.0, step: 0.01, onChange: (v) => glassParameters.matcapFresnelScale = v },
             matcapFresnelPower: { label: 'Fresnel Power', value: glassParameters.matcapFresnelPower, min: 0.5, max: 5.0, step: 0.1, onChange: (v) => glassParameters.matcapFresnelPower = v },
         }),

        // --- Audio Reactivity ---
        Audio: folder({
            'Enable Microphone': button(() => audioAnalyser.initialize()),
            'Mic Active': monitor(() => audioAnalyser.isInitialized),
            Reactivity: folder({
                audioReactiveEnabled: { label: 'Enable Reactivity', value: glassParameters.audioReactiveEnabled, onChange: v => (glassParameters.audioReactiveEnabled = v) },
                Level: monitor(() => glassParameters.audioLevel, { graph: true, interval: 50 }),
                Low: monitor(() => glassParameters.audioLow, { graph: true, interval: 50 }),
                Mid: monitor(() => glassParameters.audioMid, { graph: true, interval: 50 }),
                High: monitor(() => glassParameters.audioHigh, { graph: true, interval: 50 }),
                'Bass Impact': monitor(() => glassParameters.audioBassImpact, { graph: true, interval: 50 }),
            }),
            'Blob Response': folder({
                audioBlobEasing: { label: 'Blob Easing', value: glassParameters.audioBlobEasing, min: 0.0, max: 1.0, step: 0.01, onChange: v => (glassParameters.audioBlobEasing = v) },
                audioBassImpactSplashStrength: { label: 'Splash Strength', value: glassParameters.audioBassImpactSplashStrength, min: 0.0, max: 5.0, step: 0.1, onChange: v => (glassParameters.audioBassImpactSplashStrength = v) },
            }),
            'Surface Response': folder({
                audioSurfaceDistortionStrength: { label: 'Distort (Mids)', value: glassParameters.audioSurfaceDistortionStrength, min: 0.0, max: 5.0, step: 0.1, onChange: v => (glassParameters.audioSurfaceDistortionStrength = v) },
                audioSurfaceDistortionFreqStrength: { label: 'Distort Freq (Lows)', value: glassParameters.audioSurfaceDistortionFreqStrength, min: 0.0, max: 5.0, step: 0.1, onChange: v => (glassParameters.audioSurfaceDistortionFreqStrength = v) },
            }),
            'Rim Light Response': folder({
                audioRimLightIntensityStrength: { label: 'Intensity', value: glassParameters.audioRimLightIntensityStrength, min: 0.0, max: 3.0, step: 0.05, onChange: v => (glassParameters.audioRimLightIntensityStrength = v) },
                audioRimWidthStrength: { label: 'Width', value: glassParameters.audioRimWidthStrength, min: 0.0, max: 4.0, step: 0.1, onChange: v => (glassParameters.audioRimWidthStrength = v) },
            }),
            'Ferrofluid Response': folder({
                ferroDropletMoveStrength: { label: 'Move Strength', value: glassParameters.ferroDropletMoveStrength, min: 0.0, max: 150.0, step: 1.0, onChange: v => (glassParameters.ferroDropletMoveStrength = v) },
                ferroDropletScalePulseStrength: { label: 'Pulse Strength', value: glassParameters.ferroDropletScalePulseStrength, min: 0.0, max: 1.5, step: 0.05, onChange: v => (glassParameters.ferroDropletScalePulseStrength = v) },
            }),
            Enhancements: folder({
                audioReactivitySyncStrength: { label: 'Reactivity Sync', value: glassParameters.audioReactivitySyncStrength, min: 0.0, max: 2.0, step: 0.01, onChange: v => (glassParameters.audioReactivitySyncStrength = v) },
                audioBeatDanceStyle: { label: 'Dance Style', value: glassParameters.audioBeatDanceStyle, min: 0.0, max: 2.0, step: 0.01, onChange: v => (glassParameters.audioBeatDanceStyle = v) },
                audioHighFreqJitterStrength: { label: 'High Freq Jitter', value: glassParameters.audioHighFreqJitterStrength, min: 0.0, max: 1.0, step: 0.01, onChange: v => (glassParameters.audioHighFreqJitterStrength = v) },
                audioBassRippleSpeed: { label: 'Bass Ripple Speed', value: glassParameters.audioBassRippleSpeed, min: 0.0, max: 5.0, step: 0.01, onChange: v => (glassParameters.audioBassRippleSpeed = v) },
                audioMidFreqSwayStrength: { label: 'Mid Freq Sway', value: glassParameters.audioMidFreqSwayStrength, min: 0.0, max: 2.0, step: 0.01, onChange: v => (glassParameters.audioMidFreqSwayStrength = v) },
                audioBeatSpeedUpAmount: { label: 'Beat Speed Up', value: glassParameters.audioBeatSpeedUpAmount, min: 0.0, max: 2.0, step: 0.01, onChange: v => (glassParameters.audioBeatSpeedUpAmount = v) },
                audioPulseAttackSpeed: { label: 'Pulse Attack', value: glassParameters.audioPulseAttackSpeed, min: 0.0, max: 1.0, step: 0.01, onChange: v => (glassParameters.audioPulseAttackSpeed = v) },
                audioPulseDecaySpeed: { label: 'Pulse Decay', value: glassParameters.audioPulseDecaySpeed, min: 0.0, max: 1.0, step: 0.01, onChange: v => (glassParameters.audioPulseDecaySpeed = v) },
                audioReactiveColorEnabled: { label: 'Reactive Color', value: glassParameters.audioReactiveColorEnabled, onChange: v => (glassParameters.audioReactiveColorEnabled = v) },
                audioBeatZoom: { label: 'Beat Zoom', value: glassParameters.audioBeatZoom, min: 0.0, max: 1.0, step: 0.01, onChange: v => (glassParameters.audioBeatZoom = v) },
            }),
        }, { collapsed: false }),

        // --- Ferrofluid Effects ---
        Ferrofluid: folder({
            ferroSharpStr: { label: 'SDF Sharpen (Highs)', value: glassParameters.ferroSdfSharpnessStrength, min: 0.0, max: 1.5, step: 0.05, onChange: (v) => glassParameters.ferroSdfSharpnessStrength = v },
            ferroFreqX: { label: 'Base Freq X', value: glassParameters.ferroOscillationBaseFreqX, min: 0.1, max: 5.0, step: 0.1, onChange: (v) => glassParameters.ferroOscillationBaseFreqX = v },
            ferroFreqY: { label: 'Base Freq Y', value: glassParameters.ferroOscillationBaseFreqY, min: 0.1, max: 5.0, step: 0.1, onChange: (v) => glassParameters.ferroOscillationBaseFreqY = v },
        }),

        // --- New Bass Splash Effect ---
        "Bass Splash": folder({
            bassSplashStrength: { label: 'Splash Strength', value: glassParameters.audioBassImpactSplashStrength, min: 0.0, max: 5.0, step: 0.1, onChange: (v) => glassParameters.audioBassImpactSplashStrength = v },
            'Splash Impact': monitor(() => glassParameters.audioBassImpact.toFixed(3))
        })

    }), [presets]);

    // Effect to sync glassParameters -> Leva controls AFTER a preset is loaded
    useEffect(() => {
        if (needsLevaSync) {
            console.log("[Leva Sync] Syncing Leva controls after preset load...");
            const updateObj: { [key: string]: any } = {};
             Object.keys(glassParameters).forEach(key => {
                const value = glassParameters[key as keyof typeof glassParameters];
                if (value instanceof THREE.Color) {
                    if (key === 'glassTint') updateObj['Color.glassTint'] = '#' + value.getHexString();
                    else if (key === 'absorptionColor') updateObj['Color.absorptionColor'] = '#' + value.getHexString();
                    else if (key === 'rimColor') updateObj['Rim Light.rimColor'] = '#' + value.getHexString();
                    else updateObj[key] = '#' + value.getHexString();
                } else if (key !== 'beatActive' && key !== 'audioLevel' && key !== 'audioLow' && key !== 'audioMid' && key !== 'audioHigh') {
                    if (key === 'iorMaterial') updateObj['Optical.iorMaterial'] = value;
                    else if (key === 'ior') updateObj['Optical.ior'] = value;
                    else if (key === 'dispersion') updateObj['Optical.dispersion'] = value;
                    else if (key === 'reflectionStrength') updateObj['Optical.reflectionStrength'] = value;
                    else if (key === 'refractionStrength') updateObj['Optical.refractionStrength'] = value;
                    else if (key === 'refractionDepth') updateObj['Optical.refractionDepth'] = value;
                    else if (key === 'secondaryIOR') updateObj['Optical.secondaryIOR'] = value;
                    else if (key === 'opacity') updateObj['Optical.opacity'] = value;
                    else if (key === 'surfaceDistortion') updateObj['Surface.surfaceDistortion'] = value;
                    else if (key === 'surfaceRoughness') updateObj['Surface.surfaceRoughness'] = value;
                    else if (key === 'bumpScale') updateObj['Surface.bumpScale'] = value;
                    else if (key === 'refractionBlurStrength') updateObj['Surface.refractionBlurStrength'] = value;
                    else if (key === 'audioSurfaceDistortionStrength') updateObj['Surface.distortStr'] = value;
                    else if (key === 'audioSurfaceDistortionFreqStrength') updateObj['Surface.distortFreq'] = value;
                    else if (key === 'rimLightIntensity') updateObj['Rim Light.rimInt'] = value;
                    else if (key === 'rimWidth') updateObj['Rim Light.rimWidth'] = value;
                    else if (key === 'audioRimLightIntensityStrength') updateObj['Rim Light.audioRimInt'] = value;
                    else if (key === 'audioRimWidthStrength') updateObj['Rim Light.audioRimWidth'] = value;
                    else if (key === 'internalPatternIntensity') updateObj['Internal Pattern.internalInt'] = value;
                    else if (key === 'audioInternalPatternStrength') updateObj['Internal Pattern.audioInternalStr'] = value;
                    else if (key === 'audioInternalPatternSpeedStrength') updateObj['Internal Pattern.audioInternalSpeed'] = value;
                    else if (key === 'absorptionDensity') updateObj['Color.absorptionDensity'] = value;
                    else if (key === 'matcapTexture') updateObj['Matcap.matcapTexture'] = value;
                    else if (key === 'matcapStrength') updateObj['Matcap.matcapStrength'] = value;
                    else if (key === 'matcapBlendMode') updateObj['Matcap.matcapBlendMode'] = value;
                    else if (key === 'matcapFresnelBias') updateObj['Matcap.matcapFresnelBias'] = value;
                    else if (key === 'matcapFresnelScale') updateObj['Matcap.matcapFresnelScale'] = value;
                    else if (key === 'matcapFresnelPower') updateObj['Matcap.matcapFresnelPower'] = value;
                    else if (key === 'audioReactiveEnabled') updateObj['Audio.audioReactiveEnabled'] = value;
                    else if (key === 'ferroDropletMoveStrength') updateObj['Ferrofluid.ferroMoveStr'] = value;
                    else if (key === 'ferroDropletScalePulseStrength') updateObj['Ferrofluid.ferroPulseStr'] = value;
                    else if (key === 'ferroSdfSharpnessStrength') updateObj['Ferrofluid.ferroSharpStr'] = value;
                    else if (key === 'ferroOscillationBaseFreqX') updateObj['Ferrofluid.ferroFreqX'] = value;
                    else if (key === 'ferroOscillationBaseFreqY') updateObj['Ferrofluid.ferroFreqY'] = value;
                    else {
                        if (levaValues.hasOwnProperty(key)) { 
                            updateObj[key] = value; 
                        } else {
                            // console.warn(`[Leva Sync] Unmapped key: ${key}`);
                        }
                    }
                }
            });
            
            updateObj['selectedPreset'] = levaValues.selectedPreset; 

            setLeva(updateObj);
            console.log("[Leva Sync] Sync complete. Updated data:", updateObj);
            setNeedsLevaSync(false);
        }
    }, [needsLevaSync, setLeva, levaValues]);

    // This component renders nothing itself. Leva handles the panel.
    return null;
};
