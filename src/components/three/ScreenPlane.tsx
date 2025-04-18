import React, { FC, useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Plane, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import fragmentShader from '../../modules/glsl/raymarchingFrag.glsl';
import vertexShader from '../../modules/glsl/raymarchingVert.glsl';
import { AMOUNT, datas, glassParameters, MatcapTextureName } from '../audio/store';
import { publicPath } from '../../modules/utils';

interface ScreenPlaneProps {}

export const ScreenPlane: FC<ScreenPlaneProps> = () => {
	// Access viewport, camera, and scene for sizing and environment
	const { viewport, camera, scene } = useThree();
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const planeRef = useRef<THREE.Mesh>(null!);

	// Use the scene's environment map loaded by <Environment>
	const envMapTexture = (scene.environment as THREE.CubeTexture) || null;
	useEffect(() => {
		if (envMapTexture) {
			envMapTexture.encoding = THREE.sRGBEncoding;
			envMapTexture.mapping = THREE.CubeReflectionMapping;
		}
	}, [envMapTexture]);

	// Initialize viewport tracking
	const [viewportAspect, setViewportAspect] = useState(viewport.aspect);

	// Load matcap textures for glass-like effect
	const matcapTextures = useTexture({
		'5cad3098d01a8d232b753acad6f39972.jpg': publicPath('/assets/matcap/5cad3098d01a8d232b753acad6f39972.jpg'),
		'93e1bbcf77ece0c0f7fc79ecb8ff0d00.jpg': publicPath('/assets/matcap/93e1bbcf77ece0c0f7fc79ecb8ff0d00.jpg'),
		'944_large_remake2.jpg': publicPath('/assets/matcap/944_large_remake2.jpg'),
		'bluew.jpg': publicPath('/assets/matcap/bluew.jpg'),
		'bluew2.jpg': publicPath('/assets/matcap/bluew2.jpg'),
		'blu_green_litsphere_by_jujikabane.jpg': publicPath('/assets/matcap/blu_green_litsphere_by_jujikabane.jpg'),
		'daphz1.jpg': publicPath('/assets/matcap/daphz1.jpg'),
		'daphz2.jpg': publicPath('/assets/matcap/daphz2.jpg'),
		'daphz3.jpg': publicPath('/assets/matcap/daphz3.jpg'),
		'gooch.jpg': publicPath('/assets/matcap/gooch.jpg'),
		'jeepster_skinmat2.jpg': publicPath('/assets/matcap/jeepster_skinmat2.jpg'),
		'JoshSingh_matcap.jpg': publicPath('/assets/matcap/JoshSingh_matcap.jpg'),
		'LitSphere_example_2.jpg': publicPath('/assets/matcap/LitSphere_example_2.jpg'),
		'LitSphere_example_3.jpg': publicPath('/assets/matcap/LitSphere_example_3.jpg'),
		'LitSphere_example_4.jpg': publicPath('/assets/matcap/LitSphere_example_4.jpg'),
		'LitSphere_example_5.jpg': publicPath('/assets/matcap/LitSphere_example_5.jpg'),
		'LitSphere_test_02.jpg': publicPath('/assets/matcap/LitSphere_test_02.jpg'),
		'LitSphere_test_03.jpg': publicPath('/assets/matcap/LitSphere_test_03.jpg'),
		'LitSphere_test_04.jpg': publicPath('/assets/matcap/LitSphere_test_04.jpg'),
		'LitSphere_test_05.jpg': publicPath('/assets/matcap/LitSphere_test_05.jpg'),
		'matball01.jpg': publicPath('/assets/matcap/matball01.jpg'),
		'matball02.jpg': publicPath('/assets/matcap/matball02.jpg'),
		'matball03.jpg': publicPath('/assets/matcap/matball03.jpg'),
		'matball04.jpg': publicPath('/assets/matcap/matball04.jpg'),
		'matball05.jpg': publicPath('/assets/matcap/matball05.jpg'),
		'matball06.jpg': publicPath('/assets/matcap/matball06.jpg'),
		'matball07.jpg': publicPath('/assets/matcap/matball07.jpg'),
		'mydarkgreymetal_zbrush_matcap_by_digitalinkrod.jpg': publicPath('/assets/matcap/mydarkgreymetal_zbrush_matcap_by_digitalinkrod.jpg'),
		'mygreenshinmetal_zbrush_matcap_by_digitalinkrod.jpg': publicPath('/assets/matcap/mygreenshinmetal_zbrush_matcap_by_digitalinkrod.jpg'),
		'myredmetal_zbrush_matcap_by_digitalinkrod.jpg': publicPath('/assets/matcap/myredmetal_zbrush_matcap_by_digitalinkrod.jpg'),
		'redsphere.jpg': publicPath('/assets/matcap/redsphere.jpg'),
		'scooby_skin_mix.jpg': publicPath('/assets/matcap/scooby_skin_mix.jpg'),
		'smoothmat.jpg': publicPath('/assets/matcap/smoothmat.jpg'),
		'TwilightFisheye.jpg': publicPath('/assets/matcap/TwilightFisheye.jpg')
	}) as Record<MatcapTextureName, THREE.Texture>;
	
	// Ensure all matcap textures are in correct color space
	Object.values(matcapTextures).forEach(tex => tex.encoding = THREE.sRGBEncoding);

	// Get the currently selected matcap texture name for dependency tracking
	const selectedMatcapName = glassParameters.matcapTexture;

	// Replace embedded text
	const fragment = fragmentShader.replaceAll('AMOUNT', AMOUNT.toString());

	// Compute UV scale but maintain aspect ratio for background image
	const calculateUvScale = (vpAspect: number, texAspect: number): [number, number] => {
		const ratio = vpAspect / texAspect;
		return vpAspect < texAspect ? [ratio, 1] : [1, 1 / ratio];
	};
	const initialUvScale = calculateUvScale(viewport.aspect, viewport.aspect);

	// Create shader - useMemo dependencies updated
	const shader: any = useMemo(() => ({
		uniforms: {
			u_aspect: { value: viewport.aspect },
			u_datas: { value: datas },
			u_envMap: { value: envMapTexture },   // Converted CubeTexture envMap
			u_matcapTexture: { value: matcapTextures[selectedMatcapName] },
			u_uvScale: { value: new THREE.Vector2(...initialUvScale) },
			u_time: { value: 0.0 },
			
			// Optical properties
			u_ior: { value: glassParameters.ior },
			u_dispersion: { value: glassParameters.dispersion },
			u_reflectionStrength: { value: glassParameters.reflectionStrength },
			u_refractionStrength: { value: glassParameters.refractionStrength },
			u_refractionDepth: { value: glassParameters.refractionDepth },
			u_secondaryIOR: { value: glassParameters.secondaryIOR },
			u_opacity: { value: glassParameters.opacity },
			u_fresnelBaseReflectivity: { value: glassParameters.fresnelBaseReflectivity },
			
			// Surface properties
			u_surfaceDistortion: { value: glassParameters.surfaceDistortion },
			u_surfaceRoughness: { value: glassParameters.surfaceRoughness },
			u_bumpScale: { value: glassParameters.bumpScale },
			
			// Iridescence properties
			u_iridescenceStrength: { value: glassParameters.iridescenceStrength },
			u_iridescenceFrequency: { value: glassParameters.iridescenceFrequency },
			
			// Visual effects
			u_causticIntensity: { value: glassParameters.causticIntensity },
			u_internalPatternIntensity: { value: glassParameters.internalPatternIntensity },
			u_rimLightIntensity: { value: glassParameters.rimLightIntensity },
			u_bubbleDensity: { value: glassParameters.bubbleDensity },
			u_causticSpeed: { value: glassParameters.causticSpeed },
			u_causticScale: { value: glassParameters.causticScale },
			u_bubbleSpeed: { value: glassParameters.bubbleSpeed },
			u_bubbleSize: { value: glassParameters.bubbleSize },
			u_rimColor: { value: glassParameters.rimColor },
			u_rimWidth: { value: glassParameters.rimWidth },
			
			// Color properties
			u_glassTint: { value: glassParameters.glassTint },
			u_absorptionColor: { value: glassParameters.absorptionColor },
			u_absorptionDensity: { value: glassParameters.absorptionDensity },
			
			// Matcap properties
			u_matcapStrength: { value: glassParameters.matcapStrength },
			u_matcapBlendMode: { value: glassParameters.matcapBlendMode },
			u_matcapFresnelBias: { value: glassParameters.matcapFresnelBias },
			u_matcapFresnelScale: { value: glassParameters.matcapFresnelScale },
			u_matcapFresnelPower: { value: glassParameters.matcapFresnelPower },
			u_matcapEnabled: { value: glassParameters.matcapEnabled },

			// --- Add Audio Reactive Uniforms --- 
			u_audioLevel: { value: 0.0 },
			u_audioLow: { value: 0.0 },
			u_audioMid: { value: 0.0 },
			u_audioHigh: { value: 0.0 },
			// --- End Audio Uniforms ---
			// Add control uniforms
			u_audioReactiveEnabled: { value: glassParameters.audioReactiveEnabled },
			u_audioSurfaceDistortionStrength: { value: glassParameters.audioSurfaceDistortionStrength },
			u_audioCausticIntensityStrength: { value: glassParameters.audioCausticIntensityStrength },
			u_audioBubbleMovementStrength: { value: glassParameters.audioBubbleMovementStrength },
			u_audioRimLightIntensityStrength: { value: glassParameters.audioRimLightIntensityStrength },
			// --- Add new strength uniforms ---
			u_audioSurfaceDistortionFreqStrength: { value: glassParameters.audioSurfaceDistortionFreqStrength },
			u_audioIridescenceStrength: { value: glassParameters.audioIridescenceStrength },
			u_audioIridescenceFreqStrength: { value: glassParameters.audioIridescenceFreqStrength },
			u_audioCausticScaleStrength: { value: glassParameters.audioCausticScaleStrength },
			u_audioCausticSpeedStrength: { value: glassParameters.audioCausticSpeedStrength },
			u_audioBubbleDensityStrength: { value: glassParameters.audioBubbleDensityStrength },
			u_audioBubbleSizeStrength: { value: glassParameters.audioBubbleSizeStrength },
			u_audioRimWidthStrength: { value: glassParameters.audioRimWidthStrength },
			u_audioInternalPatternStrength: { value: glassParameters.audioInternalPatternStrength },
			u_audioInternalPatternSpeedStrength: { value: glassParameters.audioInternalPatternSpeedStrength },
			// --- Ferrofluid Uniforms ---
			u_ferroSdfSharpnessStrength: { value: glassParameters.ferroSdfSharpnessStrength },
			// --- Enhancement Uniforms ---
			u_refractionBlurStrength: { value: glassParameters.refractionBlurStrength },
			u_beatIridescenceFlash: { value: glassParameters.beatIridescenceFlash },
            // --- Bass Impact --- 
            u_audioBassImpact: { value: glassParameters.audioBassImpact },
            u_audioBassImpactSplashStrength: { value: glassParameters.audioBassImpactSplashStrength },
            u_cameraPosition: { value: new THREE.Vector3() },
            viewMatrixInverse: { value: new THREE.Matrix4() },
            projectionMatrixInverse: { value: new THREE.Matrix4() },
		},
		vertexShader,
		fragmentShader: fragment
	}), [envMapTexture, selectedMatcapName, fragment]);

	// --- Audio smoothing state ---
	const smoothedAudio = useRef(0);
	const smoothedAudioHigh = useRef(0);

	// Easing helper for natural interpolation
	const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
	const easeOutCirc = (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2));

	// --- Bass splash ripple state ---
	const lastBassSplash = useRef({ time: 0 }); // Track last big beat

	// Add a reusable vector above useFrame
	const forwardDir = useRef(new THREE.Vector3());

	useFrame(({ clock, viewport: currentViewport, camera }) => {
		if (!materialRef.current || !planeRef.current) return;
		
		// Compute forward direction and place plane slightly in front of camera
		camera.getWorldDirection(forwardDir.current);
		// place plane just beyond near clipping plane
		const offset = camera.near + 0.01;
		// Place in front of camera
		planeRef.current.position.copy(camera.position).add(forwardDir.current.multiplyScalar(offset));
		// Cast camera to PerspectiveCamera for fov and aspect
		const perspCam = camera as THREE.PerspectiveCamera;
		const fovRad = (perspCam.fov * Math.PI) / 180;
		const planeHeight = 2 * offset * Math.tan(fovRad / 2);
		const planeWidth = planeHeight * perspCam.aspect;
		planeRef.current.scale.set(planeWidth, planeHeight, 1);
		planeRef.current.quaternion.copy(camera.quaternion);

		// --- Calculate current time ---
		const t = clock.getElapsedTime();
		const now = clock.elapsedTime;
		
		// --- Audio reactivity state ---
		const audioLevel = glassParameters.audioLevel || 0;
		const audioHigh = glassParameters.audioHigh || 0;
		const audioLow = glassParameters.audioLow || 0;
		const audioMid = glassParameters.audioMid || 0;
		const audioBassImpact = glassParameters.audioBassImpact || 0;
		
		// --- Update smoothed audio values (with additional easing) ---
		// More advanced easing for smoother transitions
		const easeOutCirc = (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2));
		const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
		
		// Control ease values using our new parameters
		const attackSpeed = 0.3 + glassParameters.audioPulseAttackSpeed * 0.6; // 0.3-0.9 range
		const decaySpeed = 0.05 + glassParameters.audioPulseDecaySpeed * 0.15; // 0.05-0.2 range
		
		// Use asymmetric smoothing for fast attack but slow decay
		if (audioLevel > smoothedAudio.current) {
			smoothedAudio.current += (audioLevel - smoothedAudio.current) * attackSpeed;
		} else {
			smoothedAudio.current += (audioLevel - smoothedAudio.current) * decaySpeed;
		}
		
		// Same for high frequencies
		if (audioHigh > smoothedAudioHigh.current) {
			smoothedAudioHigh.current += (audioHigh - smoothedAudioHigh.current) * attackSpeed;
		} else {
			smoothedAudioHigh.current += (audioHigh - smoothedAudioHigh.current) * decaySpeed;
		}
		
		// Apply easing for more natural looking animations
		const easedAudio = easeOutCirc(smoothedAudio.current);
		const easedAudioHigh = easeInOutSine(smoothedAudioHigh.current);
		
		// --- Energy multiplier based on detected beat ---
		// Make animations more energetic during strong beats
		const beatEnergy = 1.0 + audioBassImpact * 0.5;
		const timeSpeed = 1.0 + audioBassImpact * glassParameters.audioBeatSpeedUpAmount * 2.0;
		
		// --- Update material time with reactive time scaling ---
		// Make time appear to flow faster during beats
		const reactiveTime = glassParameters.audioReactiveEnabled ? 
			t * (1.0 + (easedAudio * 0.5 * timeSpeed)) : t;
		
		materialRef.current.uniforms.u_time.value = reactiveTime;
		
		// --- Update aspect ratio in shader if viewport changes ---
		if (viewport.width !== currentViewport.width || viewport.height !== currentViewport.height) {
			const newAspect = currentViewport.width / currentViewport.height;
			materialRef.current.uniforms.u_aspect.value = newAspect;
			
			// Recalculate UV scale when aspect ratio changes
			const newUvScale = calculateUvScale(newAspect, viewport.aspect);
			materialRef.current.uniforms.u_uvScale.value = newUvScale;
			viewport.width = currentViewport.width;
			viewport.height = currentViewport.height;
			
			// Update plane scale to match viewport
			if (planeRef.current) {
				planeRef.current.scale.set(currentViewport.width, currentViewport.height, 1);
			}
		}
		
		// --- Handle bass ripple/splash effects ---
		if (glassParameters.audioBassImpact > 0.1) {
			lastBassSplash.current.time = now;
		}
		
		// Center for ripple (screen center)
		const center = new THREE.Vector2(0, 0);
		
		// --- Enhanced drop animation with audio reactivity ---
		datas.forEach((data, i) => {
			const baseScale = data.scale;
			
			// Get FFT data for this specific drop (using frequency bin)
			let fft = glassParameters.audioFFT?.[data.frequencyBin] ?? 0;
			if (data.frequencyBin < 20) {
				fft *= 0.5; // Reduce sensitivity for very low frequencies
			}
			const fftNorm = Math.min(fft / 128, 1.0);
			
			// Create more dynamic modulation with multiple frequencies
			const uniqueOffset = (i / datas.length) * Math.PI * 2; // Unique phase offset
			const beatSyncFactor = glassParameters.audioReactivitySyncStrength;
			
			// Oscillation with different frequencies plus audio reactivity
			const oscillation1 = 0.15 * Math.sin(reactiveTime * 1.7 + uniqueOffset);
			const oscillation2 = 0.08 * Math.cos(reactiveTime * 2.3 + uniqueOffset * 0.5);
			
			// Add variation based on drop position
			const positionVariation = Math.sin(data.position.x * 2.5) * Math.cos(data.position.y * 3.2) * 0.08;
			
			// Calculate synchronized pulsing (more in-sync as beatSyncFactor increases)
			const syncedPulse = beatSyncFactor * Math.sin(reactiveTime * 4.0) * audioMid * 0.3;
			const uniquePulse = (1.0 - beatSyncFactor) * (oscillation1 + oscillation2);
			
			// Enhanced frequency response - different scales for different frequencies
			const lowFreqScale = 0.45 * easedAudio * beatEnergy; 
			const midFreqScale = 0.35 * audioMid * beatEnergy;
			const highFreqScale = 0.25 * easedAudioHigh * beatEnergy;
			
			// Combined audio-driven scale change
			const ebbFlow = uniquePulse + syncedPulse + positionVariation;
			const audioScale = lowFreqScale + midFreqScale + highFreqScale + 0.1 * fftNorm;
			
			// Target scale combining both rhythmic oscillation and audio reactivity
			const targetScale = baseScale * (1 + ebbFlow + audioScale);
			
			// Smooth scale transitions with dynamic easing
			if (!data._smoothedScale) data._smoothedScale = baseScale;
			data._smoothedScale += (targetScale - data._smoothedScale) * 
				(glassParameters.audioBlobEasing + audioBassImpact * 0.1);
			
			// --- Bass splash ripple: animate scale based on distance from center and time since beat ---
			const pos2d = new THREE.Vector2(data.position.x, data.position.y);
			const dist = pos2d.distanceTo(center);
			
			// Configurable ripple speed
			const rippleSpeed = 0.5 + glassParameters.audioBassRippleSpeed * 2.0; // Higher = faster ripple
			const rippleWidth = 5.0 + glassParameters.audioBassRippleSpeed * 2.0; // Controls width of the ripple
			
			const rippleTime = now - lastBassSplash.current.time;
			const ripplePhase = rippleTime * rippleSpeed - dist;
			
			let ripple = 0;
			if (ripplePhase > 0 && ripplePhase < rippleWidth) {
				// Use a smoother curve for the ripple
				const normalizedPhase = ripplePhase / rippleWidth;
				ripple = Math.sin(normalizedPhase * Math.PI) * 
					glassParameters.audioBassImpact * 
					glassParameters.audioBassImpactSplashStrength * 0.7;
			}
			
			// Apply final scale with ripple effect
			materialRef.current!.uniforms.u_datas.value[i].scale = data._smoothedScale * (1 + ripple);
			
			// Apply color variations if enabled
			if (glassParameters.audioReactiveColorEnabled) {
				// Each drop can have a unique hue based on position and audio
				const hue = (0.5 + data.position.x * 0.2 + data.position.y * 0.2 + audioHigh * 0.3) % 1.0;
				const saturation = 0.3 + audioMid * 0.7; // More saturated with mids
				const lightness = 0.4 + audioLow * 0.4; // Brighter with bass
				
				// Convert HSL to RGB (simplified)
				const dropColor = new THREE.Color().setHSL(hue, saturation, lightness);
				materialRef.current!.uniforms.u_datas.value[i].color = dropColor;
			}
		});
		
		// --- Update drop positions ---
		datas.forEach((data, i) => {
			materialRef.current!.uniforms.u_datas.value[i].position.copy(data.position);
		});
		
		// --- Animate rim light intensity and color with enhanced audio reactivity ---
		const baseRim = glassParameters.rimLightIntensity;
		// Complex pulsing pattern with multiple frequencies
		const rimPulse = 0.15 * Math.sin(reactiveTime * 2.2) + 
					0.1 * Math.cos(reactiveTime * 3.7) * audioMid;
						
		// Enhance rim intensity during beats
		const audioRimBoost = audioHigh * 0.3 + audioMid * 0.2 + audioBassImpact * 0.5;
		const rimIntensity = baseRim + rimPulse + audioRimBoost * glassParameters.audioRimLightIntensityStrength;
		materialRef.current.uniforms.u_rimLightIntensity.value = Math.max(0, rimIntensity);

		// Animate rim color with audio reactivity if enabled
		if (glassParameters.audioReactiveColorEnabled) {
			// Vary between base rim color and a reactive color based on audio
			const baseColor = glassParameters.rimColor.clone();
			const accentColor = new THREE.Color('#50c8ff');
			
			// Blend more toward accent color during high frequencies and impacts
			const colorBlend = Math.min(1, Math.abs(easedAudioHigh * 0.7 + audioBassImpact * 0.3));
			const rimColor = new THREE.Color().lerpColors(
				baseColor,
				accentColor,
				colorBlend
			);
			materialRef.current.uniforms.u_rimColor.value = rimColor;
		}
		
		// --- Continue with existing code for updating optical properties ---
		// Update optical properties - every frame to ensure immediate visual feedback
		materialRef.current.uniforms.u_ior.value = glassParameters.ior;
		materialRef.current.uniforms.u_dispersion.value = glassParameters.dispersion;
		materialRef.current.uniforms.u_reflectionStrength.value = glassParameters.reflectionStrength;
		materialRef.current.uniforms.u_refractionStrength.value = glassParameters.refractionStrength;
		materialRef.current.uniforms.u_refractionDepth.value = glassParameters.refractionDepth;
		materialRef.current.uniforms.u_secondaryIOR.value = glassParameters.secondaryIOR;
		materialRef.current.uniforms.u_opacity.value = glassParameters.opacity;
		materialRef.current.uniforms.u_fresnelBaseReflectivity.value = glassParameters.fresnelBaseReflectivity;
		
		// Update surface properties
		materialRef.current.uniforms.u_surfaceDistortion.value = glassParameters.surfaceDistortion;
		materialRef.current.uniforms.u_surfaceRoughness.value = glassParameters.surfaceRoughness;
		materialRef.current.uniforms.u_bumpScale.value = glassParameters.bumpScale;
		
		// Update iridescence properties
		materialRef.current.uniforms.u_iridescenceStrength.value = glassParameters.iridescenceStrength;
		materialRef.current.uniforms.u_iridescenceFrequency.value = glassParameters.iridescenceFrequency;
		
		// Update visual effects
		materialRef.current.uniforms.u_causticIntensity.value = glassParameters.causticIntensity;
		materialRef.current.uniforms.u_internalPatternIntensity.value = glassParameters.internalPatternIntensity;
		materialRef.current.uniforms.u_bubbleDensity.value = glassParameters.bubbleDensity;
		materialRef.current.uniforms.u_causticSpeed.value = glassParameters.causticSpeed;
		materialRef.current.uniforms.u_causticScale.value = glassParameters.causticScale;
		materialRef.current.uniforms.u_bubbleSpeed.value = glassParameters.bubbleSpeed;
		materialRef.current.uniforms.u_bubbleSize.value = glassParameters.bubbleSize;
		
		// Update color properties - ensure the color is updated by reference
		materialRef.current.uniforms.u_glassTint.value = glassParameters.glassTint;
		materialRef.current.uniforms.u_absorptionColor.value = glassParameters.absorptionColor;
		materialRef.current.uniforms.u_absorptionDensity.value = glassParameters.absorptionDensity;
		
		// Update matcap properties
		materialRef.current.uniforms.u_matcapStrength.value = glassParameters.matcapStrength;
		materialRef.current.uniforms.u_matcapBlendMode.value = glassParameters.matcapBlendMode;
		materialRef.current.uniforms.u_matcapFresnelBias.value = glassParameters.matcapFresnelBias;
		materialRef.current.uniforms.u_matcapFresnelScale.value = glassParameters.matcapFresnelScale;
		materialRef.current.uniforms.u_matcapFresnelPower.value = glassParameters.matcapFresnelPower;
		materialRef.current.uniforms.u_matcapEnabled.value = glassParameters.matcapEnabled;

		// Update the selected matcap texture uniform (Still needed? Maybe not, but doesn't hurt.)
		// This might be redundant now if useMemo handles the change, but doesn't hurt.
		materialRef.current.uniforms.u_matcapTexture.value = matcapTextures[glassParameters.matcapTexture];

		// --- Update Audio Reactive Uniforms --- 
		// Update audio uniforms only if enabled
		if (glassParameters.audioReactiveEnabled) {
		materialRef.current.uniforms.u_audioLevel.value = glassParameters.audioLevel;
		materialRef.current.uniforms.u_audioLow.value = glassParameters.audioLow;
		materialRef.current.uniforms.u_audioMid.value = glassParameters.audioMid;
		materialRef.current.uniforms.u_audioHigh.value = glassParameters.audioHigh;
            materialRef.current.uniforms.u_audioBassImpact.value = glassParameters.audioBassImpact;
            materialRef.current.uniforms.u_audioBassImpactSplashStrength.value = glassParameters.audioBassImpactSplashStrength;

			// Strengths
			materialRef.current.uniforms.u_audioSurfaceDistortionStrength.value = glassParameters.audioSurfaceDistortionStrength;
			materialRef.current.uniforms.u_audioCausticIntensityStrength.value = glassParameters.audioCausticIntensityStrength;
			materialRef.current.uniforms.u_audioBubbleMovementStrength.value = glassParameters.audioBubbleMovementStrength;
			materialRef.current.uniforms.u_audioRimLightIntensityStrength.value = glassParameters.audioRimLightIntensityStrength;
			materialRef.current.uniforms.u_audioSurfaceDistortionFreqStrength.value = glassParameters.audioSurfaceDistortionFreqStrength;
			materialRef.current.uniforms.u_audioIridescenceStrength.value = glassParameters.audioIridescenceStrength;
			materialRef.current.uniforms.u_audioIridescenceFreqStrength.value = glassParameters.audioIridescenceFreqStrength;
			materialRef.current.uniforms.u_audioCausticScaleStrength.value = glassParameters.audioCausticScaleStrength;
			materialRef.current.uniforms.u_audioCausticSpeedStrength.value = glassParameters.audioCausticSpeedStrength;
			materialRef.current.uniforms.u_audioBubbleDensityStrength.value = glassParameters.audioBubbleDensityStrength;
			materialRef.current.uniforms.u_audioBubbleSizeStrength.value = glassParameters.audioBubbleSizeStrength;
			materialRef.current.uniforms.u_audioRimWidthStrength.value = glassParameters.audioRimWidthStrength;
			materialRef.current.uniforms.u_audioInternalPatternStrength.value = glassParameters.audioInternalPatternStrength;
			materialRef.current.uniforms.u_audioInternalPatternSpeedStrength.value = glassParameters.audioInternalPatternSpeedStrength;

			// Ferrofluid
			materialRef.current.uniforms.u_ferroSdfSharpnessStrength.value = glassParameters.ferroSdfSharpnessStrength;

			// Enhancement
			materialRef.current.uniforms.u_refractionBlurStrength.value = glassParameters.refractionBlurStrength;
			materialRef.current.uniforms.u_beatIridescenceFlash.value = glassParameters.beatIridescenceFlash;
		}
		// --- End Audio Uniform Updates ---

		// Update camera uniforms for world-space ray computation
		materialRef.current.uniforms.u_cameraPosition.value.copy(camera.position);
		materialRef.current.uniforms.viewMatrixInverse.value.copy(camera.matrixWorld);
		materialRef.current.uniforms.projectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
	});

	return (
		// Fullscreen quad always in front of camera
		<Plane
			ref={planeRef}
			args={[1, 1]}
			frustumCulled={false}
			scale={[viewport.width, viewport.height, 1]}
		>
			<shaderMaterial
				attach="material"
				args={[shader]}
				ref={materialRef}
				side={THREE.DoubleSide}
				depthTest={false}
				depthWrite={false}
				transparent
				blending={THREE.NormalBlending}
				key="volumetric-glass"
			/>
		</Plane>
	);
};
