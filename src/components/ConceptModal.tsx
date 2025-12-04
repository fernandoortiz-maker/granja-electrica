import React from 'react';

interface ConceptModalProps {
    onClose: () => void;
}

export const ConceptModal: React.FC<ConceptModalProps> = ({ onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>🧠 DICCIONARIO DE IA</h2>
                    <button className="close-btn" onClick={onClose}>
                        X
                    </button>
                </div>

                <div className="concept-item">
                    <span className="concept-title">1. FUZZY LOGIC (Lógica Difusa)</span>
                    <div className="concept-desc">
                        Entender valores intermedios (ej: "Medio Lleno") en lugar de absolutos
                        (0 o 1).
                    </div>
                    <div className="concept-analogy">
                        🎮 Aquí: El aldeano "siente" su nivel de batería (0.0 a 1.0) para
                        decidir el precio.
                    </div>
                </div>

                <div className="concept-item">
                    <span className="concept-title">2. PESO SINÁPTICO (Weight)</span>
                    <div className="concept-desc">
                        La importancia que una neurona le da a una señal. Es modificable.
                    </div>
                    <div className="concept-analogy">
                        🎮 Aquí: Es la "Avaricia" (W). Si es alta, venderán caro aunque tengan
                        mucha energía.
                    </div>
                </div>

                <div className="concept-item">
                    <span className="concept-title">3. BACKPROPAGATION</span>
                    <div className="concept-desc">
                        Algoritmo para corregir errores ajustando los pesos desde el resultado
                        hacia atrás.
                    </div>
                    <div className="concept-analogy">
                        🎮 Aquí: Si no logran vender, dicen "Fui muy avaro" y bajan su peso
                        (W) para la próxima.
                    </div>
                </div>

                <div className="concept-item">
                    <span className="concept-title">4. BIAS (Sesgo)</span>
                    <div className="concept-desc">
                        Un valor extra que desplaza la activación de la neurona.
                    </div>
                    <div className="concept-analogy">
                        🎮 Aquí: EL MIEDO A LA NOCHE. De noche, suman +$5 al precio solo por
                        pánico.
                    </div>
                </div>
            </div>
        </div>
    );
};
