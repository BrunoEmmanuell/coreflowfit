import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Certifique-se que o CSS existe, ou remova esta linha

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);