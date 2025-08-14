import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthPage } from '@/pages';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/otp" element={<AuthPage />} />
                <Route path="/otp" element={<AuthPage />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
)
