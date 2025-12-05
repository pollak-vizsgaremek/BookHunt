import { Route, Routes } from 'react-router'
import './App.css'
import ProtectedRoute from './pages/ProtectedRoute'

function App() {

  return (
    <>
        <Routes>
          <Route>
            <ProtectedRoute/>
          </Route>
        </Routes>
    </>
  )
}

export default App
