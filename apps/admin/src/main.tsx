import React from 'react';
import { createRoot } from 'react-dom/client';

function AdminApp() {
  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <h1>DinLipi Admin Panel</h1>
      <p>Admin workspace scaffolded for milestone 1.</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
