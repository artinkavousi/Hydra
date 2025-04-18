import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), glsl()],
	base: '/r3f-water-drops/',
	resolve: {
		alias: {
			three: resolve(__dirname, 'node_modules/three')
		}
	}
})
