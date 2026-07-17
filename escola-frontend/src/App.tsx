import React from 'react';
import PainelAcademico from './components/PainelAcademico';
import GerenciadorConteudo from './components/GerenciadorConteudo';

function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>Escola App</h1>
      <p>Use o painel abaixo para testar o backend e o conteúdo.</p>
      <PainelAcademico />
      <hr />
      <GerenciadorConteudo />
    </div>
  );
}

export default App;
