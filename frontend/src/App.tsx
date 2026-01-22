// import { useState } from 'react'

// ============ pages ============
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import "./App.css";
import { Route, Routes } from "react-router";
// ===============================

function App() {
  return (
    <>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home></Home>} />  
        </Route>
      </Routes>
    </>
  );
}

export default App;
