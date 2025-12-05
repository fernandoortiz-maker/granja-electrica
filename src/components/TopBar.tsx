import React from 'react';
import { SimulationMode } from '../types';

interface NarratorControls {
    isEnabled: boolean;
    isSpeaking: boolean;
    toggleNarrator: () => void;
    voices: SpeechSynthesisVoice[];
    selectedVoice: SpeechSynthesisVoice | null;
    setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
}

interface TopBarProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    mode: SimulationMode;
    onToggleMode: (mode: SimulationMode) => void;
    onShowConcepts: () => void;
    tick: number;
    narrator: NarratorControls;
}

export const TopBar: React.FC<TopBarProps> = ({
    isPlaying,
    onTogglePlay,
    mode,
    onToggleMode,
    onShowConcepts,
    tick,
    narrator,
}) => {
    return (
        <div className="top-bar">
            <button
                className={`mc-button ${isPlaying ? 'stop' : 'start'}`}
                onClick={onTogglePlay}
            >
                {isPlaying ? '⏸ PAUSA' : '▶ INICIO'}
            </button>
            <button
                className={`mc-button class-mode ${mode === 'class' ? 'active' : ''}`}
                onClick={() => onToggleMode('class')}
            >
                📖 CLASE
            </button>
            <button
                className={`mc-button pro-mode ${mode === 'pro' ? 'active' : ''}`}
                onClick={() => onToggleMode('pro')}
            >
                🧠 PRO (IA)
            </button>
            <button className="mc-button concepts" onClick={onShowConcepts}>
                💡 CONCEPTOS
            </button>

            <button
                className={`mc-button narrator ${narrator.isEnabled ? 'active' : ''}`}
                onClick={narrator.toggleNarrator}
                title={narrator.isEnabled ? 'Desactivar narrador' : 'Activar narrador'}
            >
                {narrator.isEnabled ? '🔊 NARRADOR' : '🔇 NARRADOR'}
            </button>

            {narrator.isEnabled && narrator.voices.length > 1 && (
                <select
                    className="voice-selector"
                    value={narrator.selectedVoice?.name || ''}
                    onChange={(e) => {
                        const voice = narrator.voices.find(v => v.name === e.target.value);
                        if (voice) narrator.setSelectedVoice(voice);
                    }}
                >
                    {narrator.voices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                            {voice.lang} - {voice.name.slice(0, 20)}
                        </option>
                    ))}
                </select>
            )}

            <div
                style={{
                    fontSize: '10px',
                    marginLeft: 'auto',
                    fontFamily: 'monospace',
                }}
            >
                HORA: {tick % 24}:00
            </div>
        </div>
    );
};
