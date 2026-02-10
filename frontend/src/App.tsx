// import { useState } from 'react'

// ============ pages ============
// import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import "./App.css";
<<<<<<< Updated upstream
import { Routes, Route } from "react-router";
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Profile from './pages/Profile';
=======
import { Route, Routes } from "react-router";
import Login from './pages/Login';
>>>>>>> Stashed changes
// ===============================

function App() {
  return (
    <>
      <Routes>
<<<<<<< Updated upstream
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<Profile />} />
=======
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home></Home>} />  
          <Route path="/Login" element={<Login></Login>} />  
        </Route>
>>>>>>> Stashed changes
      </Routes>
    </>
  );
}

export default App;
