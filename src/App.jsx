import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  // --- ESTADOS ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState('none'); // 'none', 'class', 'pro'
  const [simSpeed, setSimSpeed] = useState(2000);
  const [tick, setTick] = useState(0);
  const [showConcepts, setShowConcepts] = useState(false);

  // Datos Mercado
  const [producers, setProducers] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [priceHistory, setPriceHistory] = useState([10, 10, 10]);

  // Datos Ambiente (Día/Noche)
  const [sunIntensity, setSunIntensity] = useState(1); // 0 (Noche) a 1 (Día)

  // Visual / Narrativa
  const [activeAnim, setActiveAnim] = useState(null);
  const [explanation, setExplanation] = useState({
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
  const getFuzzyState = (energy, type) => {
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
    let focusAgent = null;
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
      const activation =
        15 - inputFuzzy * (1 - p.weights.greed) * 15 + nightBias;
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
      const activation = 5 + inputFuzzy * c.weights.willingness * 15;
      const newPrice = Math.min(c.cash, Math.floor(activation));
      return {
        ...c,
        energy: Math.max(0, c.energy - 1),
        price: newPrice,
        lastInput: inputFuzzy,
      };
    });

    // 4. MATCHING
    let dealPrice = null;
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
            narrationText = `> INPUT: Energía=${
              p.energy
            }, Sol=${currentSun.toFixed(1)}\n> DECISIÓN: Vender a $${
              p.price
            }\n> REWARD: Positivo. La red refuerza este comportamiento.`;
          } else if (mode === 'class') {
            narrationText = `¡Trato! ${p.id} vendió a ${c.id}. ${
              currentSun < 0.2
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
      failedP.weights.greed = Math.max(
        0.1,
        failedP.weights.greed + errorGradient * failedP.learningRate
      );

      if (mode === 'pro') {
        shouldPause = true;
        narrationTitle = '📉 BACKPROPAGATION (Error Correction)';
        narrationText = `> FALLO: ${failedP.id} no vendió (Precio $${
          failedP.price
        }).\n> CAUSA: Precio muy alto para la demanda actual.\n> ACCIÓN: Ajustando peso 'Greed' hacia abajo.\n> NUEVO PESO: ${failedP.weights.greed.toFixed(
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
    <div className="app-wrapper">
      {/* 1. BARRA SUPERIOR */}
      <div className="top-bar">
        <button
          className={`mc-button ${isPlaying ? 'stop' : 'start'}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '⏸ PAUSA' : '▶ INICIO'}
        </button>
        <button
          className={`mc-button class-mode ${mode === 'class' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'class' ? 'none' : 'class')}
        >
          📖 CLASE
        </button>
        <button
          className={`mc-button pro-mode ${mode === 'pro' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'pro' ? 'none' : 'pro')}
        >
          🧠 PRO (IA)
        </button>
        <button
          className="mc-button concepts"
          onClick={() => setShowConcepts(true)}
        >
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

      {/* 2. AREA DE JUEGO */}
      <div className="game-area">
        {/* Capa Día/Noche */}
        <div
          className="day-night-overlay"
          style={{ opacity: 0.7 - sunIntensity * 0.7 }}
        ></div>
        <div className="celestial-body">{sunIntensity > 0.2 ? '☀️' : '🌙'}</div>

        <div className="side-column">
          {producers.map((p) => (
            <div
              key={p.id}
              className={`agent-house producer ${
                explanation.highlightId === p.id ? 'highlight' : ''
              }`}
            >
              <div>
                {p.emoji} {p.id}
              </div>
              <div style={{ fontSize: '7px' }}>
                W: {p.weights.greed.toFixed(2)}
              </div>
              <div>
                ⚡{p.energy} 💰${p.cash}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.1)' }}>${p.price}</div>
            </div>
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
            <div
              key={c.id}
              className={`agent-house consumer ${
                explanation.highlightId === c.id ? 'highlight' : ''
              }`}
            >
              <div>
                {c.emoji} {c.id}
              </div>
              <div style={{ fontSize: '7px' }}>
                W: {c.weights.willingness.toFixed(2)}
              </div>
              <div>
                ⚡{c.energy} 💰${c.cash}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.1)' }}>${c.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. DASHBOARD INFERIOR */}
      <div className="bottom-dashboard">
        <div className="panel-section controls">
          <h3
            style={{ fontSize: '10px', margin: '0 0 10px 0', color: '#bdc3c7' }}
          >
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
          <div
            style={{ fontSize: '8px', marginTop: '5px', textAlign: 'center' }}
          >
            {mode === 'pro'
              ? 'AUTO (DEBUG)'
              : simSpeed < 500
              ? '🚀 MAX EPOCHS'
              : '🚶 NORMAL'}
          </div>
        </div>

        <div
          className={`panel-section teacher ${
            mode === 'pro' ? 'pro-active' : ''
          }`}
        >
          <div className="teacher-avatar">{mode === 'pro' ? '🤖' : '👨‍🏫'}</div>
          <div className="explanation-content">
            <div
              className={`explanation-text ${mode === 'pro' ? 'pro-text' : ''}`}
            >
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
              <button className="continue-btn" onClick={resumeSimulation}>
                [ >> CONTINUAR ]
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
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke="#333"
              strokeWidth="0.5"
            />
            <polyline points={getPolylinePoints()} className="chart-line" />
          </svg>
        </div>
      </div>

      {/* --- MODAL DE CONCEPTOS --- */}
      {showConcepts && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🧠 DICCIONARIO DE IA</h2>
              <button
                className="close-btn"
                onClick={() => setShowConcepts(false)}
              >
                X
              </button>
            </div>

            <div className="concept-item">
              <span className="concept-title">
                1. FUZZY LOGIC (Lógica Difusa)
              </span>
              <div className="concept-desc">
                Entender valores intermedios (ej: "Medio Lleno") en lugar de
                absolutos (0 o 1).
              </div>
              <div className="concept-analogy">
                🎮 Aquí: El aldeano "siente" su nivel de batería (0.0 a 1.0)
                para decidir el precio.
              </div>
            </div>

            <div className="concept-item">
              <span className="concept-title">2. PESO SINÁPTICO (Weight)</span>
              <div className="concept-desc">
                La importancia que una neurona le da a una señal. Es
                modificable.
              </div>
              <div className="concept-analogy">
                🎮 Aquí: Es la "Avaricia" (W). Si es alta, venderán caro aunque
                tengan mucha energía.
              </div>
            </div>

            <div className="concept-item">
              <span className="concept-title">3. BACKPROPAGATION</span>
              <div className="concept-desc">
                Algoritmo para corregir errores ajustando los pesos desde el
                resultado hacia atrás.
              </div>
              <div className="concept-analogy">
                🎮 Aquí: Si no logran vender, dicen "Fui muy avaro" y bajan su
                peso (W) para la próxima.
              </div>
            </div>

            <div className="concept-item">
              <span className="concept-title">4. BIAS (Sesgo)</span>
              <div className="concept-desc">
                Un valor extra que desplaza la activación de la neurona.
              </div>
              <div className="concept-analogy">
                🎮 Aquí: EL MIEDO A LA NOCHE. De noche, suman +$5 al precio solo
                por pánico.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
