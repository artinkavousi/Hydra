import React, { FC, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, AdaptiveEvents, PerformanceMonitor, Preload, Environment } from '@react-three/drei';
import { Simulator } from './Simulator';
import { ParticleSystem } from './ParticleSystem';
import { glassParameters } from '../audio/store';
// Post-processing for DoF
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';
import { DEFAULT_CUBE_FACES } from './config';
import { ScreenPlane } from './ScreenPlane';

export const TCanvas: FC = () => {
	return (
		<Canvas
			// Camera setup: initial position and frustum
			camera={{ position: [1, 1, 3.5], fov: 100, near: 0.81, far: 2000 }}
			dpr={window.devicePixelRatio}>
			{/* Performance optimizations */}
			<AdaptiveDpr pixelated />
			<AdaptiveEvents />
			<PerformanceMonitor />
			
			{/* Environment cubemap as scene background */}
			<Environment background files={DEFAULT_CUBE_FACES} />
			
			{/* Main scene content: background plane, physics sim, particles, effects */}
			<Suspense fallback={null}>
				<ScreenPlane />
				<Simulator />
				<ParticleSystem />
				{/* Depth-of-field effect pass (inlined) */}
				{glassParameters.dofEnabled && (
					<EffectComposer>
						<DepthOfField
							focusDistance={glassParameters.dofFocusDistance}
							focalLength={glassParameters.dofFocalLength}
							bokehScale={glassParameters.aperture}
							height={700}
						/>
					</EffectComposer>
				)}
			</Suspense>
			
			{/* Camera interaction */}
			<OrbitControls enablePan={true} />
			<Preload all />
		</Canvas>
	)
}
