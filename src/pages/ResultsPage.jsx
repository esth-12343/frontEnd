import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './ResultsPage.css';

const ResultsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detailData, setDetailData] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setIsLoading(true);
    const stored = JSON.parse(localStorage.getItem('examResults') || '[]');

    const enriched = await Promise.all(
      stored.map(async (item) => {
        try {
          const res = await api.get(`/attempts/${item.id}/result`);
          return { ...item, detail: res.data.data || res.data };
        } catch {
          return item;
        }
      })
    );

    setResults(enriched);
    setIsLoading(false);
  };

  const toggleDetail = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetailData(null);
      return;
    }
    setExpandedId(id);
    try {
      const res = await api.get(`/attempts/${id}/result`);
      setDetailData(res.data.data || res.data);
    } catch {
      setDetailData(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-PE', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'SUBMITTED': return t('results.graded');
      case 'NEEDS_GRADING': return t('results.pending');
      case 'IN_PROGRESS': return t('results.inProgress');
      default: return status || '—';
    }
  };

  return (
    <div className="results-container">
      <header className="results-header glass-panel">
        <div className="header-content">
          <div className="header-left">
            <img src="/logo.png" alt="Logo" className="mini-logo" />
            <h2>{t('results.title')}</h2>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/dashboard')} className="btn-logout" style={{ marginRight: 8 }}>
              {t('nav.back')}
            </button>
            <button onClick={handleLogout} className="btn-logout">{t('nav.logout')}</button>
          </div>
        </div>
      </header>

      <main className="results-main">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner-green"></div>
            <p>{t('results.loading')}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state glass-panel">
            <p>{t('results.empty')}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ marginTop: 20, maxWidth: 250 }}>
              {t('dashboard.goToExams')}
            </button>
          </div>
        ) : (
          <div className="results-list">
            {results.map((item) => (
              <div key={item.id} className="result-card glass-panel">
                <div className="result-card-main" onClick={() => toggleDetail(item.id)}>
                  <div className="result-info">
                    <h3>{item.title}</h3>
                    <span className="course-label">{item.course_name || ''}</span>
                  </div>

                  <div className="result-status-section">
                    <span className={`result-badge ${item.status === 'SUBMITTED' ? 'graded' : 'pending'}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    {item.grade != null && (
                      <span className="result-grade">{item.grade}/20</span>
                    )}
                  </div>

                  <div className="result-meta">
                    <span>{formatDate(item.submitted_at)}</span>
                  </div>

                  <span className="expand-icon">{expandedId === item.id ? '▲' : '▼'}</span>
                </div>

                {expandedId === item.id && (
                  <div className="result-detail">
                    <hr className="detail-divider" />
                    {detailData ? (
                      <div className="detail-content">
                        <div className="detail-stats">
                          <div className="stat-item">
                            <span className="stat-label">{t('results.score')}</span>
                            <span className="stat-value">{detailData.obtained_score ?? item.obtained_score ?? '—'}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">{t('results.finalGrade')}</span>
                            <span className="stat-value">{detailData.grade ?? item.grade ?? '—'}/20</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">{t('results.approved')}</span>
                            <span className={`stat-value ${detailData.approved ? 'approved' : 'failed'}`}>
                              {detailData.approved ? t('results.yes') : t('results.no')}
                            </span>
                          </div>
                        </div>
                        {detailData.feedback && (
                          <div className="feedback-box">
                            <strong>{t('results.feedback')}</strong>
                            <p>{detailData.feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="no-detail">{t('results.noDetails')}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ResultsPage;
