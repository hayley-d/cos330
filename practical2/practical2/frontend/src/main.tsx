import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthPage } from '@/pages';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/auth" element={<AuthPage />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
)
