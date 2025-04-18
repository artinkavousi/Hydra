import * as THREE from 'three'; // Import THREE directly
import { glassParameters } from './store';

class AudioAnalyser {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;
    private rafId: number | null = null;

    // Beat detection state
    private previousBassLevel = 0;
    private bassBeatThreshold = 0.1; 
    private minBassEnergy = 0.05;   
    private lastBeatTime: number | null = null;
    private beatsHistory: number[] = []; // Store timing of last few beats for BPM calculation
    private beatEnergyHistory: number[] = []; // Store energy of beats for dynamic thresholding
    private currentBPM: number = 0;
    private beatPatternStrength: number = 0; // How consistent the beat pattern is
    
    // Enhanced frequency analysis
    private lowBandHistory: number[] = [];
    private midBandHistory: number[] = [];
    private highBandHistory: number[] = [];
    private freqDeltaHistory: number[] = []; // Track rate of change for transient detection
    
    // Reactive audio state
    private transientDetected: boolean = false;
    private lastTransientTime: number | null = null;
    private currentBeatsPerBar: number = 4; // Default time signature

    isInitialized = false;
    error: string | null = null;

    async initialize() {
        if (this.isInitialized) return;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.audioContext = new window.AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // Increased FFT size for better frequency resolution
            this.analyser.smoothingTimeConstant = 0.85; // Increased smoothing for smoother reactivity

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.source.connect(this.analyser);
            // Do not connect analyser to destination to avoid hearing the mic input

            this.isInitialized = true;
            this.error = null;
            console.log('Enhanced Audio Analyser Initialized');
            this.startAnalysis();

        } catch (err) {
            console.error('Error initializing audio analyser:', err);
            this.error = 'Could not initialize audio analyser. Microphone permission denied?';
            this.isInitialized = false;
        }
    }

    private analyse = () => {
        if (!this.analyser || !this.dataArray || !this.isInitialized || !THREE) { 
            this.rafId = requestAnimationFrame(this.analyse);
            return;
        }

        this.analyser.getByteFrequencyData(this.dataArray);

        // Make FFT data accessible for per-blob animation
        glassParameters.audioFFT = Array.from(this.dataArray);

        const bufferLength = this.analyser.frequencyBinCount;
        const now = performance.now();
        
        // --- Decay all reactive parameters over time ---
        this.decayReactiveParameters();
        
        // ---------------------------------------------
        // --- Calculate overall audio energy level ---
        // ---------------------------------------------
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / bufferLength;
        let normalizedLevel = this.applyResponseCurve(Math.min(average / 120, 1.0), 0.8); // More sensitivity with non-linear curve
        normalizedLevel = this.applyEasing(normalizedLevel); // Smooth level response
        // Apply a faster response for overall level, good for general animation
        const levelSmoothingFactor = 0.4; // More responsive than before
        glassParameters.audioLevel = THREE.MathUtils.lerp(glassParameters.audioLevel, normalizedLevel, levelSmoothingFactor);

        // ------------------------------------------
        // --- Enhanced Frequency Band Analysis ---
        // ------------------------------------------
        
        // --- Bass Band Analysis (Improved) ---
        const bassEndIndex = Math.floor(bufferLength * 0.05); // First 5% of spectrum (deeper bass frequencies)
        let lowSum = 0;
        for (let i = 1; i < bassEndIndex; i++) { // Skip bin 0 (DC component)
            // Weighting: emphasize mid-bass over sub-bass
            const weight = i < 3 ? 0.5 : 1.0; // Reduce weight of very low frequencies (below ~40Hz) 
            lowSum += this.dataArray[i] * weight;
        }
        const lowAvg = bassEndIndex > 1 ? lowSum / (bassEndIndex - 1) : 0;
        
        // Improved bass response curve - more dynamic at low volumes, compressed at high
        let normalizedLow = Math.min(lowAvg / 145, 1.0);
        normalizedLow = this.applyResponseCurve(normalizedLow, 0.9); // More dynamic curve
        normalizedLow = this.applyEasing(normalizedLow); // Smooth low band response
        
        // Keep history for transient detection
        this.lowBandHistory.push(normalizedLow);
        if (this.lowBandHistory.length > 8) this.lowBandHistory.shift();
        
        // Calculate rate of change for bass frequencies
        const bassRateOfChange = this.lowBandHistory.length > 1 ? 
            normalizedLow - this.lowBandHistory[this.lowBandHistory.length - 2] : 0;
        
        // Faster response for bass (important for beat detection)
        const bassSmoothingFactor = 0.5; // Fast response
        const currentSmoothedBass = THREE.MathUtils.lerp(
            glassParameters.audioLow, 
            normalizedLow, 
            bassSmoothingFactor
        );
        glassParameters.audioLow = currentSmoothedBass;

        // --- Improved Mid Band Analysis ---
        const midStartIndex = bassEndIndex;
        const midEndIndex = Math.floor(bufferLength * 0.6); 
        
        let midSum = 0;
        // Weight middle frequencies to emphasize vocals and instruments
        for (let i = midStartIndex; i < midEndIndex; i++) {
            // Apply a frequency-dependent weighting 
            // Create a peak around the middle of the mid range (emphasize 400Hz-2kHz)
            const relativePosition = (i - midStartIndex) / (midEndIndex - midStartIndex);
            const weight = 0.5 + Math.sin(relativePosition * Math.PI) * 0.8; // Peak in the middle
            midSum += this.dataArray[i] * weight;
        }
        const midAvg = (midEndIndex - midStartIndex) > 0 ? 
            midSum / (midEndIndex - midStartIndex) : 0;
            
        let normalizedMid = Math.min(midAvg / 110, 1.0);
        
        // Adjustable response curve from parameters
        const midCurve = glassParameters.audioMidCurve;
        const midAmp = glassParameters.audioMidAmp;
        
        // Apply customizable response curve and amplification
        normalizedMid = Math.pow(normalizedMid, midCurve);
        normalizedMid = this.applyEasing(normalizedMid); // Apply easing function for smoother response
        normalizedMid = Math.min(normalizedMid * midAmp, 1.0);
        
        // Keep history for pattern detection
        this.midBandHistory.push(normalizedMid);
        if (this.midBandHistory.length > 8) this.midBandHistory.shift();
        
        // More responsive mid control (good for melody-driven animations)
        const midSmoothingFactor = 0.45;
        glassParameters.audioMid = THREE.MathUtils.lerp(
            glassParameters.audioMid, 
            normalizedMid, 
            midSmoothingFactor
        );

        // --- Improved High Band Analysis ---
        const highStartIndex = midEndIndex;
        let highSum = 0;
        
        // Apply frequency-dependent weighting for high frequencies
        for (let i = highStartIndex; i < bufferLength; i++) {
            // Emphasize lower high frequencies (5-10kHz) over very high ones
            const relativePos = (i - highStartIndex) / (bufferLength - highStartIndex);
            const weight = relativePos < 0.4 ? 1.2 - relativePos : 0.8 - relativePos * 0.5;
            highSum += this.dataArray[i] * Math.max(0.2, weight);
        }
        
        const highAvg = (bufferLength - highStartIndex) > 0 ? 
            highSum / (bufferLength - highStartIndex) : 0;
            
        let normalizedHigh = Math.min(highAvg / 95, 1.0);  // Higher sensitivity
        normalizedHigh = this.applyResponseCurve(normalizedHigh, 0.7); // Apply response curve
        normalizedHigh = this.applyEasing(normalizedHigh); // Smooth high band response
        
        // Keep history for transient detection
        this.highBandHistory.push(normalizedHigh);
        if (this.highBandHistory.length > 8) this.highBandHistory.shift();
        
        // Calculate rate of change for high frequencies
        const highRateOfChange = this.highBandHistory.length > 1 ? 
            normalizedHigh - this.highBandHistory[this.highBandHistory.length - 2] : 0;
        
        // High frequencies need faster response (important for hi-hats, cymbals)
        const highSmoothingFactor = 0.55; // Very responsive
        glassParameters.audioHigh = THREE.MathUtils.lerp(
            glassParameters.audioHigh, 
            normalizedHigh, 
            highSmoothingFactor
        );
        
        // ------------------------------------
        // --- Advanced Beat Detection ---
        // ------------------------------------
        
        // Calculate bass delta (change in bass level)
        const deltaBass = currentSmoothedBass - this.previousBassLevel;
        
        // Store delta history for adaptive thresholding
        this.freqDeltaHistory.push(deltaBass);
        if (this.freqDeltaHistory.length > 40) this.freqDeltaHistory.shift(); // Keep about 1-2 seconds of history
        
        // Calculate dynamic threshold based on recent delta history
        // This helps adapt to different music styles and volumes
        const recentDeltas = this.freqDeltaHistory.filter(delta => delta > 0); // Only positive changes
        let dynamicThreshold = 0.18; // Default threshold
        
        if (recentDeltas.length > 10) {
            // Sort deltas and take the top 40% as significant
            const sortedDeltas = [...recentDeltas].sort((a, b) => b - a);
            const significantIndex = Math.floor(sortedDeltas.length * 0.4);
            const significantDelta = sortedDeltas[Math.min(significantIndex, sortedDeltas.length - 1)];
            
            // Blend fixed threshold with adaptive threshold
            dynamicThreshold = THREE.MathUtils.lerp(0.18, significantDelta * 0.8, 0.7);
            dynamicThreshold = Math.max(0.12, Math.min(0.3, dynamicThreshold)); // Clamp to reasonable range
        }
        
        // Calculate minimum energy level required (also adaptive)
        const dynamicMinEnergy = this.beatEnergyHistory.length > 3 ?
            Math.max(0.08, Math.min(...this.beatEnergyHistory) * 0.5) : 0.08;
            
        // Detect beat with adaptive threshold
        const beatDetected = 
            deltaBass > dynamicThreshold &&
            currentSmoothedBass > dynamicMinEnergy &&
            (!this.lastBeatTime || now - this.lastBeatTime > 180); // 180ms refractory period
            
        // Update bass impact based on beat detection
        if (beatDetected) {
            // Calculate beat strength based on how much it exceeds the threshold
            const beatStrength = Math.min(1.0, deltaBass / dynamicThreshold); 
            
            // Store beat energy for history
            this.beatEnergyHistory.push(currentSmoothedBass);
            if (this.beatEnergyHistory.length > 8) this.beatEnergyHistory.shift();
            
            // Store timestamp for BPM calculation
            this.beatsHistory.push(now);
            if (this.beatsHistory.length > 12) this.beatsHistory.shift();
            
            // Calculate BPM if we have enough beats
            if (this.beatsHistory.length > 3) {
                const intervals = [];
                for (let i = 1; i < this.beatsHistory.length; i++) {
                    intervals.push(this.beatsHistory[i] - this.beatsHistory[i - 1]);
                }
                
                // Calculate average interval, excluding outliers
                intervals.sort((a, b) => a - b);
                // Remove potential outliers (top and bottom 20%)
                const validIntervals = intervals.slice(
                    Math.floor(intervals.length * 0.2),
                    Math.ceil(intervals.length * 0.8)
                );
                
                if (validIntervals.length > 0) {
                    const avgInterval = validIntervals.reduce((sum, val) => sum + val, 0) / validIntervals.length;
                    this.currentBPM = Math.round(60000 / avgInterval); // Convert to BPM
                    
                    // Constrain to reasonable BPM range
                    this.currentBPM = Math.max(60, Math.min(200, this.currentBPM));
                    
                    // Calculate beat pattern strength (consistency)
                    const intervalVariance = validIntervals.reduce(
                        (sum, val) => sum + Math.abs(val - avgInterval), 
                        0
                    ) / validIntervals.length;
                    
                    this.beatPatternStrength = 1.0 - Math.min(1.0, intervalVariance / avgInterval);
                }
            }
            
            // Set a strong bass impact value
            glassParameters.audioBassImpact = 1.0 + beatStrength * 0.5; // Stronger impact for stronger beats
            this.lastBeatTime = now;
            
            // Log beat info for debugging
            if (this.beatsHistory.length > 4) {
                console.log(`Beat detected! BPM: ${this.currentBPM}, Pattern: ${this.beatPatternStrength.toFixed(2)}`);
            }
        }
        
        // ----------------------------------------
        // --- Transient Detection (non-beat) ---
        // ----------------------------------------
        
        // Detect transients in high and mid frequencies
        const highTransientThreshold = 0.15;
        const transientDetected = 
            highRateOfChange > highTransientThreshold && 
            (!this.lastTransientTime || now - this.lastTransientTime > 80);
            
        if (transientDetected) {
            this.transientDetected = true;
            this.lastTransientTime = now;
            
            // Subtle boost to high parameter on transients
            glassParameters.audioHigh = Math.min(1.0, glassParameters.audioHigh + highRateOfChange * 0.5);
        } else {
            this.transientDetected = false;
        }
        
        // Store previous bass level for next frame
        this.previousBassLevel = currentSmoothedBass;

        this.rafId = requestAnimationFrame(this.analyse);
    }
    
    // Helper function to apply an easing curve to audio values
    private applyEasing(x: number): number {
        // Sine easing (smoother response)
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }
    
    // Apply non-linear response curve for more musical reactivity
    private applyResponseCurve(value: number, curve: number = 0.8): number {
        // Adjustable non-linear response curve
        return Math.pow(value, curve);
    }
    
    // Decay all reactive parameters to create natural falloff
    private decayReactiveParameters(): void {
        // Apply a configurable decay to the bass impact
        const bassImpactDecaySpeed = 0.7 + (1 - glassParameters.audioPulseDecaySpeed) * 0.3;
        glassParameters.audioBassImpact *= bassImpactDecaySpeed; 
        
        // Threshold for zeroing out very small values
        if (glassParameters.audioBassImpact < 0.01) {
            glassParameters.audioBassImpact = 0.0;
        }
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
}

// Export a singleton instance
export const audioAnalyser = new AudioAnalyser();

// Remove dynamic import for THREE as it's causing issues with analysis loop timing
// async function loadThree() {
//   return await import('three');
// }

// let THREE: any; // Placeholder for THREE
// loadThree().then(threeModule => {
//   THREE = threeModule;
// }); 