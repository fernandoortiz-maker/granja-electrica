import React from 'react';
import { Agent } from '../types';

interface AgentHouseProps {
    agent: Agent;
    isHighlighted: boolean;
}

export const AgentHouse: React.FC<AgentHouseProps> = ({ agent, isHighlighted }) => {
    const isProducer = agent.type === 'producer';
    const weightLabel = isProducer ? 'Greed' : 'Will';
    const weightValue = isProducer ? agent.weights.greed : agent.weights.willingness;

    return (
        <div
            className={`agent-house ${agent.type} ${isHighlighted ? 'highlight' : ''}`}
        >
            <div>
                {agent.emoji} {agent.id}
            </div>
            <div style={{ fontSize: '7px' }}>
                W: {weightValue?.toFixed(2)}
            </div>
            <div>
                ⚡{agent.energy} 💰${agent.cash}
            </div>
            <div style={{ background: 'rgba(0,0,0,0.1)' }}>${agent.price}</div>
        </div>
    );
};
