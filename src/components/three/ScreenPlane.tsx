import React, { FC, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Plane, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import fragmentShader from '../../modules/glsl/raymarchingFrag.glsl';
import vertexShader from '../../modules/glsl/raymarchingVert.glsl';
import { AMOUNT, datas, glassParameters, MatcapTextureName } from '../../modules/store';
import { publicPath } from '../../modules/utils';

export const ScreenPlane: FC = () => {
	const { viewport } = useThree();
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	// Load the background texture
	const texture = useTexture(publicPath('/assets/images/wlop.jpg'));
	texture.encoding = THREE.sRGBEncoding;
	texture.wrapS = THREE.MirroredRepeatWrapping;
	texture.wrapT = THREE.MirroredRepeatWrapping;

	// Load an environment map for reflections
	const envMap = useTexture(publicPath('/assets/images/wlop.jpg')); // Reusing same image as env map for simplicity
	envMap.encoding = THREE.sRGBEncoding;
	envMap.wrapS = THREE.MirroredRepeatWrapping;
	envMap.wrapT = THREE.MirroredRepeatWrapping;

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
	
	// Set encoding for all matcap textures
	Object.values(matcapTextures).forEach(tex => {
		tex.encoding = THREE.sRGBEncoding;
	});

	// Get the currently selected matcap texture name for dependency tracking
	const selectedMatcapName = glassParameters.matcapTexture;

	// Calculate screen size and texture aspect ratio
	const textureAspect = texture.image.width / texture.image.height;
	const aspect = viewport.aspect;
	const ratio = aspect / textureAspect;
	const [x, y] = aspect < textureAspect ? [ratio, 1] : [1, 1 / ratio];

	// Replace embedded text
	const fragment = fragmentShader.replaceAll('AMOUNT', AMOUNT.toString());

	// Create shader with uniforms for all glass parameters
	const shader: THREE.Shader = useMemo(() => ({
		uniforms: {
			u_aspect: { value: viewport.aspect },
			u_datas: { value: datas },
			u_texture: { value: texture },
			u_envMap: { value: envMap },
			u_matcapTexture: { value: matcapTextures[selectedMatcapName] },
			u_uvScale: { value: new THREE.Vector2(x, y) },
			u_time: { value: 0.0 },
			
			// Optical properties
			u_ior: { value: glassParameters.ior },
			u_dispersion: { value: glassParameters.dispersion },
			u_reflectionStrength: { value: glassParameters.reflectionStrength },
			u_refractionStrength: { value: glassParameters.refractionStrength },
			u_refractionDepth: { value: glassParameters.refractionDepth },
			u_secondaryIOR: { value: glassParameters.secondaryIOR },
			u_opacity: { value: glassParameters.opacity },
			
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

			// --- Add Audio Reactive Uniforms --- 
			u_audioLevel: { value: 0.0 },
			u_audioLow: { value: 0.0 },
			u_audioMid: { value: 0.0 },
			u_audioHigh: { value: 0.0 }
			// --- End Audio Uniforms ---
		},
		vertexShader,
		fragmentShader: fragment
	}), [viewport.aspect, texture, envMap, selectedMatcapName, x, y]);

	useFrame(({ clock }) => {
		if (!materialRef.current) return;
		
		// Update time for animations
		materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
		
		// Update drop positions
		datas.forEach((data, i) => {
			materialRef.current!.uniforms.u_datas.value[i].position.copy(data.position);
		});

		// Update optical properties - every frame to ensure immediate visual feedback
		materialRef.current.uniforms.u_ior.value = glassParameters.ior;
		materialRef.current.uniforms.u_dispersion.value = glassParameters.dispersion;
		materialRef.current.uniforms.u_reflectionStrength.value = glassParameters.reflectionStrength;
		materialRef.current.uniforms.u_refractionStrength.value = glassParameters.refractionStrength;
		materialRef.current.uniforms.u_refractionDepth.value = glassParameters.refractionDepth;
		materialRef.current.uniforms.u_secondaryIOR.value = glassParameters.secondaryIOR;
		materialRef.current.uniforms.u_opacity.value = glassParameters.opacity;
		
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
		materialRef.current.uniforms.u_rimLightIntensity.value = glassParameters.rimLightIntensity;
		materialRef.current.uniforms.u_bubbleDensity.value = glassParameters.bubbleDensity;
		materialRef.current.uniforms.u_causticSpeed.value = glassParameters.causticSpeed;
		materialRef.current.uniforms.u_causticScale.value = glassParameters.causticScale;
		materialRef.current.uniforms.u_bubbleSpeed.value = glassParameters.bubbleSpeed;
		materialRef.current.uniforms.u_bubbleSize.value = glassParameters.bubbleSize;
		materialRef.current.uniforms.u_rimColor.value = glassParameters.rimColor;
		materialRef.current.uniforms.u_rimWidth.value = glassParameters.rimWidth;
		
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
		
		// Update the selected matcap texture uniform (Still needed? Maybe not, but keep for safety)
		// This might be redundant now if useMemo handles the change, but doesn't hurt.
		materialRef.current.uniforms.u_matcapTexture.value = matcapTextures[glassParameters.matcapTexture];

		// --- Update Audio Reactive Uniforms --- 
		materialRef.current.uniforms.u_audioLevel.value = glassParameters.audioLevel;
		materialRef.current.uniforms.u_audioLow.value = glassParameters.audioLow;
		materialRef.current.uniforms.u_audioMid.value = glassParameters.audioMid;
		materialRef.current.uniforms.u_audioHigh.value = glassParameters.audioHigh;
		// --- End Audio Uniform Updates ---

		// Force uniform update
		materialRef.current.uniformsNeedUpdate = true;
	});

	return (
		<Plane args={[1, 1]} scale={[viewport.width, viewport.height, 1]}>
			<shaderMaterial args={[shader]} ref={materialRef} />
		</Plane>
	);
};
