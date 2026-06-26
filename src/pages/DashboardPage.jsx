import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './DashboardPage.css';

const DashboardPage = () => {
  const { t } = useTranslation();
  const [evaluations, setEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(null);
  const navigate = useNavigate();

  const fetchEvaluations = async () => {
    try {
      const response = await api.get('/evaluations/available');
      setEvaluations(response.data.data);
    } catch (error) {
      console.error('Error cargando exámenes:', error);
      if (error.response && error.response.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const startAttempt = async (evaluationId) => {
    if (!window.confirm(t('dashboard.confirmStart'))) {
      return;
    }
    
    setIsStarting(evaluationId);
    try {
      const response = await api.post('/attempts', { evaluationId });
      const attemptId = response.data.data.id;
      navigate(`/exam/${attemptId}`);
    } catch (error) {
      console.error('Error al iniciar el intento:', error);
      alert(t('dashboard.startError') + ': ' + (error.response?.data?.error || t('dashboard.startError')));
    } finally {
      setIsStarting(null);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel">
        <div className="header-content">
          <img src="/logo.png" alt="Logo" className="mini-logo" />
          <h2>{t('dashboard.title')}</h2>
          <LanguageSwitcher />
          <button onClick={() => navigate('/results')} className="btn-logout" style={{marginRight: 8}}>{t('dashboard.myResults')}</button>
          <button onClick={handleLogout} className="btn-logout">{t('nav.logout')}</button>
        </div>
      </header>

      <main className="dashboard-main">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner-green"></div>
            <p>{t('dashboard.loading')}</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="empty-state glass-panel">
            <p>{t('dashboard.empty')}</p>
          </div>
        ) : (
          <div className="evaluations-grid">
            {evaluations.map(exam => (
              <div key={exam.id} className="exam-card glass-panel">
                <div className="exam-header">
                  <h3>{exam.title}</h3>
                  <span className="badge time-badge">{exam.time_limit_minute} {t('dashboard.minutes')}</span>
                </div>
                <p className="exam-desc">{exam.description}</p>
                <div className="exam-meta">
                  <span><strong>{t('dashboard.professor')}</strong> {exam.teacher_name || t('dashboard.assigned')}</span>
                </div>
                
                <button 
                  onClick={() => startAttempt(exam.id)} 
                  className="btn-primary" 
                  disabled={isStarting === exam.id}
                >
                  {isStarting === exam.id ? (
                    <span className="spinner small"></span>
                  ) : (
                    <span>{t('dashboard.startExam')}</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
