import React from 'react';
import { Agent, AnimationState } from '../types';
import { AgentHouse } from './AgentHouse';

interface GameAreaProps {
    sunIntensity: number;
    producers: Agent[];
    consumers: Agent[];
    activeAnim: AnimationState | null;
    highlightId: string | null;
}

export const GameArea: React.FC<GameAreaProps> = ({
    sunIntensity,
    producers,
    consumers,
    activeAnim,
    highlightId,
}) => {
    return (
        <div className="game-area">
            {/* Capa Día/Noche */}
            <div
                className="day-night-overlay"
                style={{ opacity: 0.7 - sunIntensity * 0.7 }}
            ></div>
            <div className="celestial-body">{sunIntensity > 0.2 ? '☀️' : '🌙'}</div>

            <div className="side-column">
                {producers.map((p) => (
                    <AgentHouse
                        key={p.id}
                        agent={p}
                        isHighlighted={highlightId === p.id}
                    />
                ))}
            </div>

            <div className="animation-layer">
                {activeAnim && activeAnim.type === 'right' && (
                    <>
                        <div className="walker right">{activeAnim.seller.emoji}</div>
                        <div className="walker wait-right">{activeAnim.buyer.emoji}</div>
                        <div className="deal-popup right">🤝 ${activeAnim.price}</div>
                    </>
                )}
                {activeAnim && activeAnim.type === 'left' && (
                    <>
                        <div className="walker wait-left">{activeAnim.seller.emoji}</div>
                        <div className="walker left">{activeAnim.buyer.emoji}</div>
                        <div className="deal-popup left">🤝 ${activeAnim.price}</div>
                    </>
                )}
            </div>

            <div className="side-column">
                {consumers.map((c) => (
                    <AgentHouse
                        key={c.id}
                        agent={c}
                        isHighlighted={highlightId === c.id}
                    />
                ))}
            </div>
        </div>
    );
};
