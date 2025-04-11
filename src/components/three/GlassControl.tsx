import React, { FC, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { GUIController } from '../../modules/gui';
import { glassParameters, materialIORs, syncMaterialIOR, MaterialName } from '../../modules/store';

export const GlassControl: FC = () => {
  // Keep the last update timestamp to avoid too frequent updates
  const lastUpdateRef = useRef(0);
  const needsUpdateRef = useRef(false);

  // Force syncing parameters between UI and shader
  useFrame(() => {
    const now = Date.now();
    // Only update if needed and not too frequent (at most every 100ms)
    if (needsUpdateRef.current && now - lastUpdateRef.current > 100) {
      needsUpdateRef.current = false;
      lastUpdateRef.current = now;
      
      // Force immediate parameter sync for all shaders
      Object.keys(glassParameters).forEach(key => {
        // Update any cached values by using the same reference but changing properties
        if (key === 'glassTint') {
          const color = glassParameters.glassTint;
          color.r = color.r; // Trigger update by self-assignment
          color.g = color.g;
          color.b = color.b;
        }
      });
    }
  });

  useEffect(() => {
    const gui = GUIController.instance;
    let iorController: any; // Store reference to the IOR slider
    
    // Function to update IOR based on material selection
    const updateIORFromMaterial = (materialName: string) => {
      if (materialName !== 'Custom' && materialName in materialIORs) {
        // Get the validated material name
        const validMaterial = materialName as MaterialName;
        
        // Update the parameter value directly
        glassParameters.ior = materialIORs[validMaterial];
        
        // If we have a reference to the IOR controller, update its display
        if (iorController) {
          iorController.updateDisplay();
        }
        
        // Mark that we need a shader update
        needsUpdateRef.current = true;
        
        console.log(`Set IOR to ${glassParameters.ior} from material: ${materialName}`);
      }
    };

    // Create folders for different parameter categories
    const opticalFolder = gui.setFolder('Optical Properties');
    
    // First add the IOR slider so we can get its reference
    iorController = opticalFolder.addNumericSlider(glassParameters, 'ior', 1.0, 2.5, 0.01, 'Index of Refraction');
    
    // Add material preset dropdown - place it at the top visually
    const materialController = opticalFolder.addDropdown(
      glassParameters, 
      'iorMaterial', 
      Object.keys(materialIORs),
      'Material Preset'
    );
    
    // Update IOR immediately on initial material selection
    updateIORFromMaterial(glassParameters.iorMaterial);
    
    // Add callback to update IOR value when material changes
    materialController.onChange((value: any) => {
      // Ensure we're getting a string value
      const materialName = String(value);
      updateIORFromMaterial(materialName);
    });
    
    // Add onChange to IOR slider to set material to Custom when manually changed
    iorController.onChange((value: number) => {
      glassParameters.iorMaterial = 'Custom' as MaterialName;
      materialController.updateDisplay();
      needsUpdateRef.current = true;
    });
    
    // Add onChange handlers to all sliders to mark updates needed
    const addSlider = (obj: any, prop: string, min: number, max: number, step: number, name: string) => {
      const ctrl = opticalFolder.addNumericSlider(obj, prop, min, max, step, name);
      ctrl.onChange(() => { needsUpdateRef.current = true; });
      return ctrl;
    };
    
    addSlider(glassParameters, 'dispersion', 0.0, 0.1, 0.001, 'Chromatic Aberration');
    addSlider(glassParameters, 'reflectionStrength', 0.0, 1.0, 0.01, 'Reflection Strength');
    addSlider(glassParameters, 'refractionStrength', 0.0, 2.0, 0.01, 'Refraction Strength');
    addSlider(glassParameters, 'refractionDepth', 0.1, 3.0, 0.1, 'Refraction Depth');
    addSlider(glassParameters, 'secondaryIOR', 0.0, 1.0, 0.01, 'Birefringence');
    addSlider(glassParameters, 'opacity', 0.0, 1.0, 0.01, 'Transparency');
    opticalFolder.open(true);

    const surfaceFolder = gui.setFolder('Surface Properties');
    addSlider(glassParameters, 'surfaceDistortion', 0.0, 0.1, 0.001, 'Surface Irregularities');
    addSlider(glassParameters, 'surfaceRoughness', 0.0, 1.0, 0.01, 'Surface Roughness');
    addSlider(glassParameters, 'bumpScale', 0.0, 0.1, 0.001, 'Bump Mapping');
    surfaceFolder.open(true);
    
    const iridescenceFolder = gui.setFolder('Iridescence');
    addSlider(glassParameters, 'iridescenceStrength', 0.0, 1.0, 0.01, 'Strength');
    addSlider(glassParameters, 'iridescenceFrequency', 0.1, 10.0, 0.1, 'Frequency');
    iridescenceFolder.open(true);

    const effectsFolder = gui.setFolder('Visual Effects');
    addSlider(glassParameters, 'causticIntensity', 0.0, 0.5, 0.01, 'Caustic Intensity');
    addSlider(glassParameters, 'internalPatternIntensity', 0.0, 0.1, 0.001, 'Interior Details');
    addSlider(glassParameters, 'rimLightIntensity', 0.0, 1.0, 0.01, 'Edge Highlights');
    addSlider(glassParameters, 'bubbleDensity', 0.0, 0.2, 0.01, 'Bubble Density');
    effectsFolder.open(true);

    // --- Add new controls to Effects folder --- 
    effectsFolder.addNumericSlider(glassParameters, 'causticSpeed', 0.0, 2.0, 0.01, 'Caustic Speed').onChange(() => { needsUpdateRef.current = true; });
    effectsFolder.addNumericSlider(glassParameters, 'causticScale', 5.0, 100.0, 1.0, 'Caustic Scale').onChange(() => { needsUpdateRef.current = true; });
    effectsFolder.addNumericSlider(glassParameters, 'bubbleSpeed', 0.0, 0.5, 0.01, 'Bubble Speed').onChange(() => { needsUpdateRef.current = true; });
    effectsFolder.addNumericSlider(glassParameters, 'bubbleSize', 0.1, 2.0, 0.05, 'Bubble Size').onChange(() => { needsUpdateRef.current = true; });
    effectsFolder.addNumericSlider(glassParameters, 'rimWidth', 1.0, 10.0, 0.1, 'Rim Width').onChange(() => { needsUpdateRef.current = true; });
    const rimColorController = effectsFolder.addColor(glassParameters, 'rimColor', undefined, 'Rim Color');
    rimColorController.onChange(() => { needsUpdateRef.current = true; });
    // --- End new controls --- 

    const colorFolder = gui.setFolder('Color Properties');
    const colorController = colorFolder.addColor(glassParameters, 'glassTint', undefined, 'Glass Tint');
    colorController.onChange(() => { needsUpdateRef.current = true; });
    colorFolder.open(true);

    // --- Add new controls to Color folder --- 
    const absorptionColorController = colorFolder.addColor(glassParameters, 'absorptionColor', undefined, 'Absorption Color');
    absorptionColorController.onChange(() => { needsUpdateRef.current = true; });
    colorFolder.addNumericSlider(glassParameters, 'absorptionDensity', 0.0, 2.0, 0.01, 'Absorption Density').onChange(() => { needsUpdateRef.current = true; });
    // --- End new controls --- 

    // Add matcap controls
    const matcapFolder = gui.setFolder('Matcap Properties');
    
    // Add matcap texture selection with descriptive names
    const matcapTextureController = matcapFolder.addDropdown(
      glassParameters,
      'matcapTexture',
      {
        'Silver Chrome': '5cad3098d01a8d232b753acad6f39972.jpg',
        'Pearl': '93e1bbcf77ece0c0f7fc79ecb8ff0d00.jpg',
        'Glass Remake': '944_large_remake2.jpg',
        'Blue Water': 'bluew.jpg',
        'Light Blue Water': 'bluew2.jpg',
        'Blue Green Glass': 'blu_green_litsphere_by_jujikabane.jpg',
        'Crystal 1': 'daphz1.jpg',
        'Crystal 2': 'daphz2.jpg',
        'Crystal 3': 'daphz3.jpg',
        'Artistic': 'gooch.jpg',
        'Skin Material': 'jeepster_skinmat2.jpg',
        'Josh Singh Special': 'JoshSingh_matcap.jpg',
        'Glass Example 2': 'LitSphere_example_2.jpg',
        'Glass Example 3': 'LitSphere_example_3.jpg',
        'Glass Example 4': 'LitSphere_example_4.jpg',
        'Glass Example 5': 'LitSphere_example_5.jpg',
        'Glass Test 2': 'LitSphere_test_02.jpg',
        'Glass Test 3': 'LitSphere_test_03.jpg',
        'Glass Test 4': 'LitSphere_test_04.jpg',
        'Glass Test 5': 'LitSphere_test_05.jpg',
        'Material Ball 1': 'matball01.jpg',
        'Material Ball 2': 'matball02.jpg',
        'Material Ball 3': 'matball03.jpg',
        'Material Ball 4': 'matball04.jpg',
        'Material Ball 5': 'matball05.jpg',
        'Material Ball 6': 'matball06.jpg',
        'Material Ball 7': 'matball07.jpg',
        'Dark Grey Metal': 'mydarkgreymetal_zbrush_matcap_by_digitalinkrod.jpg',
        'Green Shiny Metal': 'mygreenshinmetal_zbrush_matcap_by_digitalinkrod.jpg',
        'Red Metal': 'myredmetal_zbrush_matcap_by_digitalinkrod.jpg',
        'Red Sphere': 'redsphere.jpg',
        'Scooby Skin': 'scooby_skin_mix.jpg',
        'Smooth Material': 'smoothmat.jpg',
        'Twilight Fisheye': 'TwilightFisheye.jpg'
      },
      'Matcap Texture'
    );
    matcapTextureController.onChange(() => { needsUpdateRef.current = true; });
    
    addSlider(glassParameters, 'matcapStrength', 0.0, 1.0, 0.01, 'Matcap Strength');
    
    // Add blend mode dropdown
    const blendModeController = matcapFolder.addDropdown(
      glassParameters,
      'matcapBlendMode',
      { 'Normal': 0, 'Add': 1, 'Multiply': 2 },
      'Blend Mode'
    );
    blendModeController.onChange(() => { needsUpdateRef.current = true; });
    
    // Add fresnel controls for matcap
    addSlider(glassParameters, 'matcapFresnelBias', 0.0, 1.0, 0.01, 'Fresnel Bias');
    addSlider(glassParameters, 'matcapFresnelScale', 0.0, 1.0, 0.01, 'Fresnel Scale');
    addSlider(glassParameters, 'matcapFresnelPower', 0.5, 5.0, 0.1, 'Fresnel Power');
    matcapFolder.open(true);

    // Cleanup
    return () => {
      // Close all folders but don't destroy GUI since it's a singleton
      gui.setFolder('Optical Properties').open(false);
      gui.setFolder('Surface Properties').open(false);
      gui.setFolder('Iridescence').open(false);
      gui.setFolder('Visual Effects').open(false);
      gui.setFolder('Color Properties').open(false);
      gui.setFolder('Matcap Properties').open(false);
    };
  }, []);

  return null;
}; 