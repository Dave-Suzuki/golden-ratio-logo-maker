import { createRoot } from 'react-dom/client';
import { installFetchShim } from './api';
import { App } from './App';

installFetchShim();
const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
