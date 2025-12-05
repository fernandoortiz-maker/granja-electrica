import React, { useEffect } from 'react';
import './App.css';
import { TopBar } from './components/TopBar';
import { GameArea } from './components/GameArea';
import { BottomDashboard } from './components/BottomDashboard';
import { ConceptModal } from './components/ConceptModal';
import { useSimulation } from './hooks/useSimulation';
import { useNarrator } from './hooks/useNarrator';
import { SimulationMode } from './types';

const App: React.FC = () => {
    const {
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
    } = useSimulation();

    const narrator = useNarrator({ rate: 1.0, pitch: 1.0 });

    useEffect(() => {
        if (narration && narrator.isEnabled && isPlaying) {
            narrator.speak(narration);
        }
    }, [narration]);

    useEffect(() => {
        if (narrator.isEnabled && isPlaying) {
            narrator.speakNow('Simulación iniciada.');
        }
    }, [isPlaying]);

    const handleToggleMode = (newMode: SimulationMode) => {
        setMode(mode === newMode ? 'none' : newMode);
    };

    return (
        <div className="app-wrapper">
            <TopBar
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                mode={mode}
                onToggleMode={handleToggleMode}
                onShowConcepts={() => setShowConcepts(true)}
                tick={tick}
                narrator={narrator}
            />

            <GameArea
                sunIntensity={sunIntensity}
                producers={producers}
                consumers={consumers}
                activeAnim={activeAnim}
                highlightId={explanation.highlightId}
            />

            <BottomDashboard
                mode={mode}
                simSpeed={simSpeed}
                setSimSpeed={setSimSpeed}
                explanation={explanation}
                onResume={resumeSimulation}
                priceHistory={priceHistory}
            />

            {showConcepts && <ConceptModal onClose={() => setShowConcepts(false)} />}

            {narrator.isEnabled && narrator.isSpeaking && (
                <div className="narrator-indicator">
                    🔊 Narrando...
                </div>
            )}
        </div>
    );
};

export default App;
