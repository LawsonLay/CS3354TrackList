
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Post from './Post.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Post />
  </StrictMode>
);
