import { useState, useEffect, useCallback, useRef } from 'react';

export interface NarratorOptions {
    rate?: number;      // 0.1 - 10 (velocidad)
    pitch?: number;     // 0 - 2 (tono)
    volume?: number;    // 0 - 1
    lang?: string;      // 'es-ES', 'es-MX', etc.
}

export const useNarrator = (options: NarratorOptions = {}) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const queueRef = useRef<string[]>([]);
    const isSpeakingRef = useRef(false);

    const {
        rate = 1.1,
        pitch = 1,
        volume = 1,
        lang = 'es'
    } = options;

    // Cargar voces disponibles
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            const spanishVoices = availableVoices.filter(v => v.lang.startsWith('es'));
            setVoices(spanishVoices.length > 0 ? spanishVoices : availableVoices);
            
            // Seleccionar voz por defecto (preferir español mexicano o español)
            const defaultVoice = spanishVoices.find(v => v.lang === 'es-MX') 
                || spanishVoices.find(v => v.lang === 'es-ES')
                || spanishVoices[0]
                || availableVoices[0];
            
            if (defaultVoice && !selectedVoice) {
                setSelectedVoice(defaultVoice);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // Procesar cola de mensajes
    const processQueue = useCallback(() => {
        if (isSpeakingRef.current || queueRef.current.length === 0) return;

        const text = queueRef.current.shift();
        if (!text) return;

        isSpeakingRef.current = true;
        setIsSpeaking(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            // Pequeña pausa entre frases
            setTimeout(() => processQueue(), 300);
        };

        utterance.onerror = () => {
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            processQueue();
        };

        window.speechSynthesis.speak(utterance);
    }, [rate, pitch, volume, selectedVoice]);

    // Función para narrar
    const speak = useCallback((text: string) => {
        if (!isEnabled) return;
        
        queueRef.current.push(text);
        processQueue();
    }, [isEnabled, processQueue]);

    // Función para narrar inmediatamente (interrumpe lo actual)
    const speakNow = useCallback((text: string) => {
        if (!isEnabled) return;
        
        window.speechSynthesis.cancel();
        queueRef.current = [text];
        isSpeakingRef.current = false;
        processQueue();
    }, [isEnabled, processQueue]);

    // Parar narración
    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        queueRef.current = [];
        isSpeakingRef.current = false;
        setIsSpeaking(false);
    }, []);

    // Toggle narrador
    const toggleNarrator = useCallback(() => {
        if (isEnabled) {
            stop();
        }
        setIsEnabled(!isEnabled);
    }, [isEnabled, stop]);

    // Limpiar al desmontar
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return {
        isEnabled,
        isSpeaking,
        voices,
        selectedVoice,
        setSelectedVoice,
        speak,
        speakNow,
        stop,
        toggleNarrator,
        setIsEnabled,
    };
};
