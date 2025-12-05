import { useState, useEffect } from 'react';
import { Agent, AnimationState, Explanation, SimulationMode } from '../types';

export const useSimulation = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<SimulationMode>('none');
    const [simSpeed, setSimSpeed] = useState(2000);
    const [tick, setTick] = useState(0);
    const [showConcepts, setShowConcepts] = useState(false);

    const [producers, setProducers] = useState<Agent[]>([]);
    const [consumers, setConsumers] = useState<Agent[]>([]);
    const [priceHistory, setPriceHistory] = useState<number[]>([10, 10, 10]);

    const [sunIntensity, setSunIntensity] = useState(1);

    const [activeAnim, setActiveAnim] = useState<AnimationState | null>(null);
    const [narration, setNarration] = useState<string>('');
    const [explanation, setExplanation] = useState<Explanation>({
        title: 'SISTEMA LISTO',
        text: 'Pulsa INICIO para arrancar el entorno.',
        highlightId: null,
        isPausedForPro: false,
    });

    useEffect(() => {
        setProducers(
            Array.from({ length: 4 }, (_, i) => ({
                id: `P${i}`,
                type: 'producer' as const,
                energy: 5,
                cash: 0,
                price: 15,
                emoji: '👨‍🌾',
                weights: { greed: 0.5 },
                learningRate: 0.05,
            }))
        );

        setConsumers(
            Array.from({ length: 4 }, (_, i) => ({
                id: `C${i}`,
                type: 'consumer' as const,
                energy: 5,
                cash: 100,
                price: 5,
                emoji: '👷',
                weights: { willingness: 0.5 },
                learningRate: 0.05,
            }))
        );
    }, []);

    useEffect(() => {
        if (!isPlaying) return;
        const currentSpeed = mode === 'class' ? 3500 : simSpeed;
        const interval = setInterval(() => runStep(), currentSpeed);
        return () => clearInterval(interval);
    }, [isPlaying, simSpeed, mode, producers, consumers, tick]);

    const getFuzzyState = (energy: number, type: 'producer' | 'consumer') => {
        if (type === 'producer') return Math.min(1, Math.max(0, (energy - 2) / 10));
        else return Math.min(1, Math.max(0, (10 - energy) / 10));
    };

    const runStep = () => {
        const nextTick = tick + 1;
        setTick(nextTick);
        setActiveAnim(null);

        const hourOfDay = nextTick % 24;
        let currentSun = 0;
        if (hourOfDay > 5 && hourOfDay < 19) {
            currentSun = 1 - Math.abs(12 - hourOfDay) / 7;
        }
        currentSun = Math.max(0, currentSun);
        setSunIntensity(currentSun);

        let narrationTitle = '';
        let narrationText = '';
        let narratorText = '';
        let focusAgent: string | null = null;
        let shouldPause = false;

        const newProds = producers.map((p) => {
            const generated = Math.random() < currentSun ? 2 : 0;
            const newEnergy = p.energy + generated;

            const inputFuzzy = getFuzzyState(newEnergy, 'producer');
            const nightBias = currentSun < 0.2 ? 5 : 0;

            const greed = p.weights.greed ?? 0.5;
            const activation = 15 - inputFuzzy * (1 - greed) * 15 + nightBias;
            const newPrice = Math.max(2, Math.floor(activation));

            return {
                ...p,
                energy: newEnergy,
                price: newPrice,
                lastInput: inputFuzzy,
            };
        });

        const newCons = consumers.map((c) => {
            const inputFuzzy = getFuzzyState(c.energy, 'consumer');
            const willingness = c.weights.willingness ?? 0.5;
            const activation = 5 + inputFuzzy * willingness * 15;
            const newPrice = Math.min(c.cash, Math.floor(activation));
            return {
                ...c,
                energy: Math.max(0, c.energy - 1),
                price: newPrice,
                lastInput: inputFuzzy,
            };
        });

        let dealPrice: number | null = null;
        const sellers = newProds
            .filter((p) => p.energy > 0)
            .sort(() => Math.random() - 0.5);
        const buyers = newCons
            .filter((c) => c.cash > 0)
            .sort(() => Math.random() - 0.5);
        let dealMade = false;

        for (const p of sellers) {
            if (dealMade) break;
            for (const c of buyers) {
                if (c.price >= p.price) {
                    const price = Math.floor((c.price + p.price) / 2);
                    dealPrice = price;
                    dealMade = true;

                    p.energy--;
                    p.cash += price;
                    c.energy++;
                    c.cash -= price;

                    setActiveAnim({
                        seller: p,
                        buyer: c,
                        price: price,
                        type: Math.random() > 0.5 ? 'right' : 'left',
                    });
                    focusAgent = p.id;

                    if (mode === 'pro') {
                        shouldPause = true;
                        narrationTitle = '🧠 REWARD FUNCTION (+1)';
                        narrationText = `> INPUT: Energía=${p.energy}, Sol=${currentSun.toFixed(1)}\n> DECISIÓN: Vender a $${p.price}\n> REWARD: Positivo. La red refuerza este comportamiento.`;
                        narratorText = `Función de recompensa activada. El productor ${p.id} vendió energía a ${price} dólares. La red neuronal refuerza este comportamiento exitoso.`;
                    } else if (mode === 'class') {
                        narrationText = `¡Trato! ${p.id} vendió a ${c.id}. ${currentSun < 0.2 ? 'Es de noche, por eso el precio es alto.' : 'Hay sol, precios estables.'}`;
                        narratorText = `¡Trato cerrado! El productor ${p.id} vendió energía al consumidor ${c.id} por ${price} dólares. ${currentSun < 0.2 ? 'Es de noche, por eso el precio subió.' : 'Hay buena luz solar, los precios están estables.'}`;
                    }
                    break;
                }
            }
        }

        if (!dealMade) {
            const failedP = newProds[0];
            focusAgent = failedP.id;
            const errorGradient = -0.1;
            const currentGreed = failedP.weights.greed ?? 0.5;
            failedP.weights.greed = Math.max(
                0.1,
                currentGreed + errorGradient * failedP.learningRate
            );

            if (mode === 'pro') {
                shouldPause = true;
                narrationTitle = '📉 BACKPROPAGATION (Error Correction)';
                narrationText = `> FALLO: ${failedP.id} no vendió (Precio $${failedP.price}).\n> CAUSA: Precio muy alto para la demanda actual.\n> ACCIÓN: Ajustando peso 'Greed' hacia abajo.\n> NUEVO PESO: ${failedP.weights.greed?.toFixed(2)}`;
                narratorText = `Backpropagation activado. El productor ${failedP.id} no logró vender. Su precio de ${failedP.price} dólares fue muy alto. Ajustando el peso de avaricia hacia abajo para la próxima iteración.`;
            } else if (mode === 'class') {
                narrationText = `Nadie compra. ${failedP.id} bajará sus expectativas para la próxima.`;
                narratorText = `Nadie quiso comprar. El productor ${failedP.id} aprendió la lección y bajará sus expectativas de precio.`;
            }
        }

        setPriceHistory((prev) => {
            const val = dealPrice !== null ? dealPrice : prev[prev.length - 1];
            const newHistory = [...prev, val];
            if (newHistory.length > 25) newHistory.shift();
            return newHistory;
        });
        setProducers(newProds);
        setConsumers(newCons);

        if (shouldPause) {
            setIsPlaying(false);
            setExplanation({
                title: narrationTitle,
                text: narrationText,
                highlightId: focusAgent,
                isPausedForPro: true,
            });
        } else {
            setExplanation({
                title: mode === 'class' ? 'Clase de Economía' : 'Monitor de Red',
                text: narrationText || `Hora: ${hourOfDay}:00. Sol: ${(currentSun * 100).toFixed(0)}%.`,
                highlightId: focusAgent,
                isPausedForPro: false,
            });
        }

        if (narratorText) {
            setNarration(narratorText);
        } else if (hourOfDay === 6) {
            setNarration('Amanece en la granja. Los paneles solares comienzan a generar energía.');
        } else if (hourOfDay === 19) {
            setNarration('Anochece. La producción solar se detiene. Los precios comenzarán a subir.');
        }
    };

    const resumeSimulation = () => {
        setExplanation((prev) => ({
            ...prev,
            isPausedForPro: false,
            text: 'Calculando siguiente epoch...',
        }));
        setIsPlaying(true);
    };

    return {
        isPlaying,
        setIsPlaying,
        mode,
        setMode,
        simSpeed,
        setSimSpeed,
        tick,
        showConcepts,
        setShowConcepts,
        producers,
        consumers,
        priceHistory,
        sunIntensity,
        activeAnim,
        explanation,
        narration,
        resumeSimulation,
    };
};
