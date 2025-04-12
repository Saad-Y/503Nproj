import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SignupPage from './pages/SignupPage';

const SERVER_URL = "http://localhost:5000"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/auth_check`, {
          credentials: 'include',
          withCredentials: true
        });
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkToken();
  }, []);

 

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} SERVER_URL={SERVER_URL} />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/signup" element={<SignupPage SERVER_URL={SERVER_URL} />} />
      </Routes>
    </Router>
  );
}