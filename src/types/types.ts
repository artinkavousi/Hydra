export type Data = {
	position: THREE.Vector3
	scale: number
	frequencyBin: number
	_smoothedScale?: number // For adaptive easing of blob scale
}
