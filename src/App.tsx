import React from 'react';
import './App.css';
import { TopBar } from './components/TopBar';
import { GameArea } from './components/GameArea';
import { BottomDashboard } from './components/BottomDashboard';
import { ConceptModal } from './components/ConceptModal';
import { useSimulation } from './hooks/useSimulation';

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
        resumeSimulation,
    } = useSimulation();

    return (
        <div className="app-wrapper">
            {/* 1. BARRA SUPERIOR */}
            <TopBar
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                mode={mode}
                onToggleMode={(newMode) => setMode(mode === newMode ? 'none' : newMode)}
                onShowConcepts={() => setShowConcepts(true)}
                tick={tick}
            />

            {/* 2. AREA DE JUEGO */}
            <GameArea
                sunIntensity={sunIntensity}
                producers={producers}
                consumers={consumers}
                activeAnim={activeAnim}
                highlightId={explanation.highlightId}
            />

            {/* 3. DASHBOARD INFERIOR */}
            <BottomDashboard
                mode={mode}
                simSpeed={simSpeed}
                setSimSpeed={setSimSpeed}
                explanation={explanation}
                onResume={resumeSimulation}
                priceHistory={priceHistory}
            />

            {/* --- MODAL DE CONCEPTOS --- */}
            {showConcepts && <ConceptModal onClose={() => setShowConcepts(false)} />}
        </div>
    );
};

export default App;
