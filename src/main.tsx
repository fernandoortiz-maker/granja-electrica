import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // <-- CORREGIDO: Ya somos vecinos, no hace falta decir "src"
import './App.css'; // <-- CORREGIDO: Busca el archivo que está al lado

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
