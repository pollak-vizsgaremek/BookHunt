// import { useState } from 'react'

// ============ pages ============
// import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import "./App.css";
import { Routes, Route } from "react-router";
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import { useNavigate } from "react-router";
// ===============================

function FloatingWishlistButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/wishlist')}
      className="fixed bottom-6 left-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-3 sm:p-4 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.8)] transition-all duration-300 transform hover:-translate-y-1 focus:outline-none flex items-center justify-center group"
      title="Go to Wishlist"
    >
      <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wishlist" element={<Wishlist />} />
      </Routes>
      <FloatingWishlistButton />
    </>
  );
}

export default App;
