import React from 'react';
import { Explanation, SimulationMode } from '../types';

interface BottomDashboardProps {
    mode: SimulationMode;
    simSpeed: number;
    setSimSpeed: (speed: number) => void;
    explanation: Explanation;
    onResume: () => void;
    priceHistory: number[];
}

export const BottomDashboard: React.FC<BottomDashboardProps> = ({
    mode,
    simSpeed,
    setSimSpeed,
    explanation,
    onResume,
    priceHistory,
}) => {
    const getPolylinePoints = () => {
        if (priceHistory.length < 2) return '';
        const maxVal = Math.max(...priceHistory, 30);
        return priceHistory
            .map((val, i) => {
                const x = (i / (priceHistory.length - 1)) * 100;
                const y = 100 - (val / maxVal) * 80;
                return `${x},${y}`;
            })
            .join(' ');
    };

    return (
        <div className="bottom-dashboard">
            <div className="panel-section controls">
                <h3 style={{ fontSize: '10px', margin: '0 0 10px 0', color: '#bdc3c7' }}>
                    VELOCIDAD / LR
                </h3>
                <input
                    type="range"
                    min="200"
                    max="3000"
                    step="100"
                    value={3200 - simSpeed}
                    onChange={(e) => setSimSpeed(3200 - Number(e.target.value))}
                    style={{ width: '100%' }}
                    disabled={mode === 'pro' || explanation.isPausedForPro}
                />
                <div style={{ fontSize: '8px', marginTop: '5px', textAlign: 'center' }}>
                    {mode === 'pro'
                        ? 'AUTO (DEBUG)'
                        : simSpeed < 500
                            ? '🚀 MAX EPOCHS'
                            : '🚶 NORMAL'}
                </div>
            </div>

            <div className={`panel-section teacher ${mode === 'pro' ? 'pro-active' : ''}`}>
                <div className="teacher-avatar">{mode === 'pro' ? '🤖' : '👨‍🏫'}</div>
                <div className="explanation-content">
                    <div className={`explanation-text ${mode === 'pro' ? 'pro-text' : ''}`}>
                        {explanation.title && (
                            <div
                                style={{
                                    textDecoration: 'underline',
                                    marginBottom: '5px',
                                    fontWeight: 'bold',
                                }}
                            >
                                {explanation.title}
                            </div>
                        )}
                        <div style={{ whiteSpace: 'pre-line' }}>{explanation.text}</div>
                    </div>
                    {explanation.isPausedForPro && (
                        <button className="continue-btn" onClick={onResume}>
                            [ &gt;&gt; CONTINUAR ]
                        </button>
                    )}
                </div>
            </div>

            <div className="panel-section chart">
                <div
                    style={{
                        position: 'absolute',
                        top: 2,
                        left: 5,
                        fontSize: 8,
                        color: '#2ecc71',
                    }}
                >
                    MERCADO ($)
                </div>
                <svg
                    className="chart-svg"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#333" strokeWidth="0.5" />
                    <polyline points={getPolylinePoints()} className="chart-line" />
                </svg>
            </div>
        </div>
    );
};
