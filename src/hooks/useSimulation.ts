import { useState, useEffect } from 'react';
import { Agent, AnimationState, Explanation, SimulationMode } from '../types';

export const useSimulation = () => {
    // --- ESTADOS ---
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<SimulationMode>('none');
    const [simSpeed, setSimSpeed] = useState(2000);
    const [tick, setTick] = useState(0);
    const [showConcepts, setShowConcepts] = useState(false);

    // Datos Mercado
    const [producers, setProducers] = useState<Agent[]>([]);
    const [consumers, setConsumers] = useState<Agent[]>([]);
    const [priceHistory, setPriceHistory] = useState<number[]>([10, 10, 10]);

    // Datos Ambiente (Día/Noche)
    const [sunIntensity, setSunIntensity] = useState(1); // 0 (Noche) a 1 (Día)

    // Visual / Narrativa
    const [activeAnim, setActiveAnim] = useState<AnimationState | null>(null);
    const [explanation, setExplanation] = useState<Explanation>({
        title: 'SISTEMA LISTO',
        text: 'Pulsa INICIO para arrancar el entorno.',
        highlightId: null,
        isPausedForPro: false,
    });

    // 1. Inicialización
    useEffect(() => {
        setProducers(
            Array.from({ length: 4 }, (_, i) => ({
                id: `P${i}`,
                type: 'producer',
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
                type: 'consumer',
                energy: 5,
                cash: 100,
                price: 5,
                emoji: '👷',
                weights: { willingness: 0.5 },
                learningRate: 0.05,
            }))
        );
    }, []);

    // 2. Loop
    useEffect(() => {
        if (!isPlaying) return;
        const currentSpeed = mode === 'class' ? 3500 : simSpeed;
        const interval = setInterval(() => runStep(), currentSpeed);
        return () => clearInterval(interval);
    }, [isPlaying, simSpeed, mode, producers, consumers, tick]);

    // --- LÓGICA DE FUZZIFICACIÓN ---
    const getFuzzyState = (energy: number, type: 'producer' | 'consumer') => {
        if (type === 'producer') return Math.min(1, Math.max(0, (energy - 2) / 10));
        else return Math.min(1, Math.max(0, (10 - energy) / 10));
    };

    // --- PASO DE SIMULACIÓN ---
    const runStep = () => {
        const nextTick = tick + 1;
        setTick(nextTick);
        setActiveAnim(null);

        // 1. CÁLCULO SOLAR (Ciclo 24h)
        const hourOfDay = nextTick % 24;
        // Sol brilla entre las 6 y las 18. Pico a las 12.
        let currentSun = 0;
        if (hourOfDay > 5 && hourOfDay < 19) {
            currentSun = 1 - Math.abs(12 - hourOfDay) / 7; // Parábola simple
        }
        currentSun = Math.max(0, currentSun);
        setSunIntensity(currentSun);

        let narrationTitle = '';
        let narrationText = '';
        let focusAgent: string | null = null;
        let shouldPause = false;

        // 2. PRODUCTORES (Generación Solar + IA)
        let newProds = producers.map((p) => {
            // Generación depende del sol
            const generated = Math.random() < currentSun ? 2 : 0;
            const newEnergy = p.energy + generated;

            // FORWARD PASS (IA)
            const inputFuzzy = getFuzzyState(newEnergy, 'producer');

            // Bias nocturno: Si es de noche, el precio base sube por miedo (scarcity bias)
            const nightBias = currentSun < 0.2 ? 5 : 0;

            // Neurona: Base + (Estado * Peso) + BiasNocturno
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

        // 3. CONSUMIDORES (Gasto + IA)
        let newCons = consumers.map((c) => {
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

        // 4. MATCHING
        let dealPrice: number | null = null;
        const sellers = newProds
            .filter((p) => p.energy > 0)
            .sort(() => Math.random() - 0.5);
        const buyers = newCons
            .filter((c) => c.cash > 0)
            .sort(() => Math.random() - 0.5);
        let dealMade = false;

        for (let p of sellers) {
            if (dealMade) break;
            for (let c of buyers) {
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

                    // Explicaciones
                    if (mode === 'pro') {
                        shouldPause = true;
                        narrationTitle = '🧠 REWARD FUNCTION (+1)';
                        narrationText = `> INPUT: Energía=${p.energy
                            }, Sol=${currentSun.toFixed(1)}\n> DECISIÓN: Vender a $${p.price
                            }\n> REWARD: Positivo. La red refuerza este comportamiento.`;
                    } else if (mode === 'class') {
                        narrationText = `¡Trato! ${p.id} vendió a ${c.id}. ${currentSun < 0.2
                                ? 'Es de noche, por eso el precio es alto.'
                                : 'Hay sol, precios estables.'
                            }`;
                    }
                    break;
                }
            }
        }

        // 5. BACKPROPAGATION (Fallo)
        if (!dealMade) {
            const failedP = newProds[0];
            focusAgent = failedP.id;
            // Ajuste de peso
            const errorGradient = -0.1;
            const currentGreed = failedP.weights.greed ?? 0.5;
            failedP.weights.greed = Math.max(
                0.1,
                currentGreed + errorGradient * failedP.learningRate
            );

            if (mode === 'pro') {
                shouldPause = true;
                narrationTitle = '📉 BACKPROPAGATION (Error Correction)';
                narrationText = `> FALLO: ${failedP.id} no vendió (Precio $${failedP.price
                    }).\n> CAUSA: Precio muy alto para la demanda actual.\n> ACCIÓN: Ajustando peso 'Greed' hacia abajo.\n> NUEVO PESO: ${failedP.weights.greed?.toFixed(
                        2
                    )}`;
            } else if (mode === 'class') {
                narrationText = `Nadie compra. ${failedP.id} bajará sus expectativas para la próxima.`;
            }
        }

        // Actualizar estados
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
                text:
                    narrationText ||
                    `Hora: ${hourOfDay}:00. Sol: ${(currentSun * 100).toFixed(0)}%.`,
                highlightId: focusAgent,
                isPausedForPro: false,
            });
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
        resumeSimulation,
    };
};
