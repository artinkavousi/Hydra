import React, { FC, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Physics, usePlane, useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { datas, glassParameters } from '../audio/store';
import { Data } from '../../types/types';

export const Simulator: FC = () => {
	return (
		<Physics gravity={[0, 0, 0]} iterations={10} broadphase="SAP">
			{/* debug mode */}
			{/* <Debug color="#fff" scale={1.05}>
				<Collisions />
				{datas.map((data, i) => (
					<PhysicalSphere key={i} data={data} />
				))}
			</Debug> */}

			{/* product mode */}
			<Collisions />
			{datas.map((data, i) => (
				<PhysicalSphere key={i} data={data} />
			))}
		</Physics>
	)
}

// ========================================================
const Collisions: FC = () => {
	// back
	usePlane(() => ({ position: [0, 0, -1], rotation: [0, 0, 0] }))
	// front
	usePlane(() => ({ position: [0, 0, 5], rotation: [0, -Math.PI, 0] }))
	// // bottom
	// usePlane(() => ({ position: [0, -4, 0], rotation: [-Math.PI / 2, 0, 0] }))
	// // top
	// usePlane(() => ({ position: [0, 4, 0], rotation: [Math.PI / 2, 0, 0] }))

	const [, api] = useSphere(() => ({ type: 'Kinematic', args: [3] }))

	useFrame(({ mouse, viewport }) => {
		const x = (mouse.x * viewport.width) / 2
		const y = (mouse.y * viewport.height) / 2
		api.position.set(x, y, 1.5)
	})

	return null
}

// ========================================================
const PhysicalSphere: FC<{ data: Data }> = ({ data }) => {
	const baseScale = data.scale

	const [ref, api] = useSphere(() => ({
		mass: 1,
		angularDamping: 0.1,
		linearDamping: 0.95,
		fixedRotation: true,
		args: [baseScale],
		position: data.position.toArray()
	}))

	const clockRef = useRef(new THREE.Clock());
	const uniqueIdentifier = useRef(Math.random()); // Unique ID for each drop to create variation

	useEffect(() => {
		const vec = new THREE.Vector3()
		const forceVec = new THREE.Vector3()
		const unsubscribe = api.position.subscribe(p => {
			data.position.set(p[0], p[1], p[2])

			// Base centering force
			vec
				.set(p[0], p[1], p[2])
				.normalize()
				.multiplyScalar(-baseScale * 30)
			api.applyForce(vec.toArray(), [0, 0, 0])

			if (glassParameters.audioReactiveEnabled) {
				const audioLow = glassParameters.audioLow;
				const audioMid = glassParameters.audioMid;
				const audioHigh = glassParameters.audioHigh;
				const audioLevel = glassParameters.audioLevel;
				const audioBassImpact = glassParameters.audioBassImpact;
				const elapsedTime = clockRef.current.getElapsedTime();
				const uniqueOffset = uniqueIdentifier.current * 100;

				// Dynamic frequency values based on audio (more variation)
				const uniqueFreqX = data.position.x * glassParameters.ferroOscillationBaseFreqX * (1 + audioHigh * 0.5) + 3.0;
				const uniqueFreqY = data.position.y * glassParameters.ferroOscillationBaseFreqY * (1 + audioMid * 0.4) + 5.0;
				
				// Enhanced force based on audio bands - different bands affect different directions
				let forceStrength = glassParameters.ferroDropletMoveStrength;
				
				// 1. Low frequency spiral force (bass)
				const bassForce = audioLow * forceStrength;
				const spiralAngle = elapsedTime * 2.0 + uniqueOffset;
				const spiralRadius = bassForce * 0.5;
				const spiralX = Math.cos(spiralAngle) * spiralRadius;
				const spiralY = Math.sin(spiralAngle) * spiralRadius;
				
				// 2. Mids affect oscillation pattern
				const midForce = audioMid * forceStrength * 0.8;
				const patternPhase = elapsedTime + uniqueOffset * 0.1;
				const patternX = Math.sin(patternPhase * uniqueFreqX) * midForce;
				const patternY = Math.cos(patternPhase * uniqueFreqY) * midForce;
				
				// 3. High frequencies add random jitters
				const highForce = audioHigh * forceStrength * 0.6;
				const jitterX = (Math.random() * 2 - 1) * highForce;
				const jitterY = (Math.random() * 2 - 1) * highForce;
				
				// 4. Bass impact creates sudden force toward or away from center
				const impactForce = audioBassImpact * forceStrength * 2.0;
				const distanceFromCenter = Math.sqrt(p[0]*p[0] + p[1]*p[1]);
				let impactX = 0, impactY = 0;
				if (distanceFromCenter > 0.01) {
					// Alternate between explosive and implosive forces
					const direction = Math.sin(elapsedTime * 0.5 + uniqueOffset) > 0 ? 1 : -1;
					impactX = (p[0] / distanceFromCenter) * impactForce * direction;
					impactY = (p[1] / distanceFromCenter) * impactForce * direction;
				}
				
				// Combine all forces
				forceVec.set(
					spiralX + patternX + jitterX + impactX,
					spiralY + patternY + jitterY + impactY,
					0 // Keep force planar
				);
				api.applyForce(forceVec.toArray(), [0, 0, 0]);

				// Enhance scale pulsing - coordinate it with audio frequencies and position
				const bassPulse = audioLow * glassParameters.ferroDropletScalePulseStrength * 1.2;
				const midPulse = audioMid * glassParameters.ferroDropletScalePulseStrength * 0.8;
				const highPulse = audioHigh * glassParameters.ferroDropletScalePulseStrength * 0.5;
				
				// Add rhythmic pulsing based on drop's position (different drops pulse differently)
				const positionBasedPhase = (p[0] * 0.5 + p[1] * 0.5) * 2.0;
				const rhythmicPulse = Math.sin(elapsedTime * 4.0 + positionBasedPhase) * midPulse * 0.5;
				
				// Create ripple effect from center on bass beats
				const rippleFactor = Math.max(0, 1 - distanceFromCenter * 0.5);
				const bassImpactPulse = audioBassImpact * glassParameters.ferroDropletScalePulseStrength * 2.0 * rippleFactor;
				
				// Combine all pulse effects
				data.scale = baseScale * (1.0 + bassPulse + midPulse + highPulse + rhythmicPulse + bassImpactPulse);
			} else { // Reset scale if reactivity is disabled
				data.scale = baseScale;
			}
		})

		return () => {
			unsubscribe()
		}
	}, [api, baseScale, data])

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
		};
	}, []);

	return null
}
