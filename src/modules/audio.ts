import { glassParameters } from './store';

class AudioAnalyser {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;
    private rafId: number | null = null;

    isInitialized = false;
    error: string | null = null;

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.audioContext = new window.AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256; // Smaller FFT size for faster updates, adjust as needed
            this.analyser.smoothingTimeConstant = 0.75; // Smoother transitions

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.source.connect(this.analyser);
            // Do not connect analyser to destination to avoid hearing the mic input

            this.isInitialized = true;
            this.error = null;
            console.log('Audio Analyser Initialized');
            this.startAnalysis();

        } catch (err) {
            console.error('Error initializing audio analyser:', err);
            this.error = 'Could not initialize audio analyser. Microphone permission denied?';
            this.isInitialized = false;
        }
    }

    private analyse = () => {
        if (!this.analyser || !this.dataArray || !this.isInitialized) {
            this.rafId = requestAnimationFrame(this.analyse);
            return;
        }

        this.analyser.getByteFrequencyData(this.dataArray);

        const bufferLength = this.analyser.frequencyBinCount;
        
        // Calculate overall level (average)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize to 0-1 range (approx) and apply some smoothing
        const normalizedLevel = Math.min(average / 128, 1.0); // 128 is half of the max byte value (255)
        glassParameters.audioLevel = THREE.MathUtils.lerp(glassParameters.audioLevel, normalizedLevel, 0.1);


        // Calculate low, mid, high band levels (simple split)
        const lowEnd = Math.floor(bufferLength * 0.2);
        const midEnd = Math.floor(bufferLength * 0.6);
        
        let lowSum = 0;
        for (let i = 0; i < lowEnd; i++) {
            lowSum += this.dataArray[i];
        }
        const lowAvg = lowEnd > 0 ? lowSum / lowEnd : 0;
        const normalizedLow = Math.min(lowAvg / 128, 1.0);
        glassParameters.audioLow = THREE.MathUtils.lerp(glassParameters.audioLow, normalizedLow, 0.1);

        let midSum = 0;
        for (let i = lowEnd; i < midEnd; i++) {
            midSum += this.dataArray[i];
        }
        const midAvg = (midEnd - lowEnd) > 0 ? midSum / (midEnd - lowEnd) : 0;
        const normalizedMid = Math.min(midAvg / 128, 1.0);
        glassParameters.audioMid = THREE.MathUtils.lerp(glassParameters.audioMid, normalizedMid, 0.1);
        
        let highSum = 0;
        for (let i = midEnd; i < bufferLength; i++) {
            highSum += this.dataArray[i];
        }
        const highAvg = (bufferLength - midEnd) > 0 ? highSum / (bufferLength - midEnd) : 0;
        const normalizedHigh = Math.min(highAvg / 128, 1.0);
         glassParameters.audioHigh = THREE.MathUtils.lerp(glassParameters.audioHigh, normalizedHigh, 0.1);

        this.rafId = requestAnimationFrame(this.analyse);
    }

    startAnalysis() {
        if (this.rafId === null) {
            this.analyse();
        }
    }

    stopAnalysis() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
         if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
        this.isInitialized = false;
         console.log('Audio Analyser Stopped');
    }
    
    // Simple LERP for smoothing
    private lerp(start: number, end: number, amount: number): number {
        return (1 - amount) * start + amount * end;
    }
}

// Export a singleton instance
export const audioAnalyser = new AudioAnalyser();

// Import THREE dynamically only if needed within methods
async function loadThree() {
  return await import('three');
}

let THREE: any; // Placeholder for THREE
loadThree().then(threeModule => {
  THREE = threeModule;
}); 