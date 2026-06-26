import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './LoginPage.css';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    
    try {
      const endpoint = role === 'TEACHER' ? '/auth/login/teacher' : '/auth/login/student';
      const response = await api.post(endpoint, {
        email,
        password
      });
      
      // Guardar token y datos del usuario
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirigir al dashboard según rol
      const redirectPath = role === 'TEACHER' ? '/teacher-dashboard' : '/dashboard';
      navigate(redirectPath);
      
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage(t('login.errorNetwork'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Círculos decorativos de fondo (Glassmorphism UI) */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="login-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <LanguageSwitcher />
        </div>
        {/* Logo placeholder */}
        <div className="logo-container">
          <img src="/logo.png" alt="Evaluate Project Logo" className="logo" onError={handleImageError} />
        </div>

        <h1 className="login-title">{t('app.welcome')}</h1>
        <p className="login-subtitle">{t('app.subtitle')}</p>

        <div className="input-group role-selector">
          <label>{t('nav.loginAs')}</label>
          <div className="role-buttons">
            <button 
              type="button"
              className={`role-btn ${role === 'STUDENT' ? 'active' : ''}`}
              onClick={() => setRole('STUDENT')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>{t('nav.student')}</span>
            </button>
            <button 
              type="button"
              className={`role-btn ${role === 'TEACHER' ? 'active' : ''}`}
              onClick={() => setRole('TEACHER')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              <span>{t('nav.teacher')}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="email">{t('login.email')}</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="form-control" 
              placeholder={role === 'TEACHER' ? t('login.emailPlaceholderTeacher') : t('login.emailPlaceholderStudent')} 
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="form-control" 
              placeholder={t('login.passwordPlaceholder')} 
              required
            />
          </div>

          {/* Muestra error si falla el login */}
          {errorMessage && (
            <div className="error-alert">
              {errorMessage}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {!isLoading ? <span>{t('login.loginButton')}</span> : <span className="spinner"></span>}
          </button>
        </form>

        <div className="register-link">
          <span>{t('login.noAccountTeacher')} </span>
          <Link to="/register/teacher">{t('login.registerTeacher')}</Link>
        </div>
        <div className="register-link">
          <span>{t('login.noAccountStudent')} </span>
          <Link to="/register/student">{t('login.registerStudent')}</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
