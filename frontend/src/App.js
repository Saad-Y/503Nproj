import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import { useEffect, useState } from 'react';
import { pastelTheme } from './theme';
import Header from './components/Header';
import SignupPage from './pages/SignupPage';
import GenerateQuizFromDoc  from './components/GenerateQuizFromDoc';
import QuizPage  from './pages/QuizPage';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log(SERVER_URL);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch(`${SERVER_URL}/auth_check`, {
      credentials: 'include'
    }).then(res => setIsAuthenticated(res.ok));
  }, []);

  return (
    <ThemeProvider theme={createTheme(pastelTheme)}>
      <CssBaseline />
      <Router>
        <Header isAuthenticated={isAuthenticated} onLogout={() => setIsAuthenticated(false)} SERVER_URL={SERVER_URL} />
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} SERVER_URL={SERVER_URL} />} />
          <Route path="/dashboard" element={<Dashboard SERVER_URL={SERVER_URL} />} />
          <Route path="/signup" element={<SignupPage SERVER_URL={SERVER_URL} />} />
          <Route
              path="/generate-quiz-from-doc"
              element={<GenerateQuizFromDoc SERVER_URL={SERVER_URL} />} />
          <Route path="/quiz" element={<QuizPage />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}
