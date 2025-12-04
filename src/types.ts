export interface AgentWeights {
  greed?: number;
  willingness?: number;
}

export interface Agent {
  id: string;
  type: 'producer' | 'consumer';
  energy: number;
  cash: number;
  price: number;
  emoji: string;
  weights: AgentWeights;
  learningRate: number;
  lastInput?: number;
}

export interface Explanation {
  title: string;
  text: string;
  highlightId: string | null;
  isPausedForPro: boolean;
}

export interface AnimationState {
  seller: Agent;
  buyer: Agent;
  price: number;
  type: 'left' | 'right';
}

export type SimulationMode = 'none' | 'class' | 'pro';
