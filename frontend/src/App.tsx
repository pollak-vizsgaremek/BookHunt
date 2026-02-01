// import { useState } from 'react'

// ============ pages ============
// import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import "./App.css";
import { Routes, Route } from "react-router";
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
// ===============================

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> {/* I'll merge these two later with a profile page */}
      </Routes>
    </>
  );
}

export default App;
