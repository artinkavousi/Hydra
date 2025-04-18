import React, { FC, useEffect } from 'react';
import { css } from '@emotion/css';
import { TCanvas } from './three/TCanvas';
import { LevaControls } from './LevaControls';
import { audioAnalyser } from './audio/audio';
import { AnimatedCursor } from './AnimatedCursor';
import { Leva } from 'leva';

// App.tsx: Root component that initializes audio, shows controls, and renders the 3D canvas
export const App: FC = () => {
	useEffect(() => {
		audioAnalyser.initialize();
		return () => {
			audioAnalyser.stopAnalysis();
		};
	}, []);

	return (
		<div className={styles.container}>
			{/* Leva UI and Custom Controls */}
			<Leva collapsed={false} />
			<AnimatedCursor />
			<LevaControls />
			{/* 3D Canvas Scene */}
			<TCanvas />
		</div>
	)
}

const styles = {
	container: css`
		position: relative;
		width: 100vw;
		height: 100vh;
	`
}
