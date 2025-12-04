import React from 'react';
import { SimulationMode } from '../types';

interface TopBarProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    mode: SimulationMode;
    onToggleMode: (mode: SimulationMode) => void;
    onShowConcepts: () => void;
    tick: number;
}

export const TopBar: React.FC<TopBarProps> = ({
    isPlaying,
    onTogglePlay,
    mode,
    onToggleMode,
    onShowConcepts,
    tick,
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
