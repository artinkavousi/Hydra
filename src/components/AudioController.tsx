import React, { FC, useEffect, useState, CSSProperties } from 'react';
import { audioAnalyser } from '../modules/audio';

export const AudioController: FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [isInit, setIsInit] = useState(false);

    const initializeAudio = async () => {
        await audioAnalyser.initialize();
        setError(audioAnalyser.error);
        setIsInit(audioAnalyser.isInitialized);
    };

    useEffect(() => {
        initializeAudio();
        // Cleanup on unmount
        return () => {
            audioAnalyser.stopAnalysis();
        };
    }, []);

    // Optional: Provide a button to re-initialize if permission was initially denied
    if (!isInit && error) {
        return (
            <div style={styles.container}>
                <p style={styles.errorText}>Audio Error: {error}</p>
                <button onClick={initializeAudio} style={styles.button}>
                    Enable Microphone
                </button>
            </div>
        );
    }
    
    // Render nothing if initialized successfully or if no error occurred yet
    return null; 
};

const styles: Record<string, CSSProperties> = {
    container: {
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'sans-serif',
        fontSize: '12px'
    },
    errorText: {
        color: '#ff8888',
        marginBottom: '8px'
    },
    button: {
        padding: '5px 10px',
        cursor: 'pointer'
    }
}; 