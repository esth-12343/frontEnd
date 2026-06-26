import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TimezoneSelect, { detectBrowserTimezone } from '../components/TimezoneSelect';
import './StudentRegisterPage.css';


const StudentRegisterPage = () => {
  const [formData, setFormData] = useState({
    cui: '',
    name: '',
    father_surname: '',
    mother_surname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // ── l10n: inicializar con la zona horaria detectada del navegador ──
    timezone: detectBrowserTimezone(),
  });
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t('register.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage(t('register.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      // Excluir confirmPassword del payload e incluir timezone en preferences
      const { confirmPassword, timezone, ...rest } = formData;

      // Obtener idioma guardado (solo el código base: 'es', 'en', 'pt')
      const rawLang = localStorage.getItem('i18nextLng') || 'es';
      const language = rawLang.split('-')[0];

      // Garantizar siempre un timezone válido aunque formData.timezone esté vacío
      const resolvedTimezone = timezone || detectBrowserTimezone();

      const payload = {
        ...rest,
        preferences: {
          timezone: resolvedTimezone,
          language,
        },
      };
      await api.post('/auth/register/student', payload);

      setSuccessMessage(t('register.successStudent'));

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage(t('register.errorNetwork'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <div className="register-card glass-panel">
        <div className="logo-container">
          <img src="/logo.png" alt="Evaluate Project Logo" className="logo" onError={handleImageError} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <LanguageSwitcher />
        </div>
        <h1 className="register-title">{t('register.titleStudent')}</h1>
        <p className="register-subtitle">{t('register.subtitleStudent')}</p>

        {errorMessage && (
          <div className="error-alert">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="success-alert">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group">
            <label htmlFor="cui">{t('register.cui')}</label>
            <input
              type="text"
              id="cui"
              name="cui"
              value={formData.cui}
              onChange={handleChange}
              className="form-control"
              placeholder={t('register.cuiPlaceholder')}
              required
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="name">{t('register.name')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                placeholder={t('register.namePlaceholder')}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="father_surname">{t('register.fatherSurname')}</label>
              <input
                type="text"
                id="father_surname"
                name="father_surname"
                value={formData.father_surname}
                onChange={handleChange}
                className="form-control"
                placeholder={t('register.fatherSurnamePlaceholder')}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="mother_surname">{t('register.motherSurname')}</label>
              <input
                type="text"
                id="mother_surname"
                name="mother_surname"
                value={formData.mother_surname}
                onChange={handleChange}
                className="form-control"
                placeholder={t('register.motherSurnamePlaceholder')}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">{t('register.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder={t('register.emailPlaceholderStudent')}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="phone">{t('register.phone')}</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-control"
              placeholder={t('register.phonePlaceholder')}
            />
          </div>

          {/* ── Zona Horaria (l10n) ── */}
          <div className="input-group">
            <label htmlFor="timezone">{t('register.timezone')}</label>
            <TimezoneSelect
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="password">{t('register.password')}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-control"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {!isLoading ? <span>{t('register.registerButton')}</span> : <span className="spinner"></span>}
          </button>
        </form>

        <div className="login-link">
          <span>{t('register.alreadyHaveAccount')} </span>
          <Link to="/login">{t('register.loginLink')}</Link>
        </div>
      </div>
    </div>
  );
};

export default StudentRegisterPage;