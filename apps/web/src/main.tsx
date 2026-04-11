import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <h1>DinLipi Web</h1>
      <p>Milestone 1 scaffold is ready.</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
