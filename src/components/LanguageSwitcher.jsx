import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const cycleLanguage = () => {
    const langs = ['es', 'en', 'pt'];
    const currentIndex = langs.indexOf(i18n.language?.substring(0, 2) || 'es');
    const nextIndex = (currentIndex + 1) % langs.length;
    i18n.changeLanguage(langs[nextIndex]);
  };

  const currentLang = i18n.language?.substring(0, 2) || 'es';
  
  let flag = '🇵🇪';
  let label = 'ES';
  let title = 'Cambiar idioma';

  if (currentLang === 'en') {
    flag = '🇺🇸';
    label = 'EN';
    title = 'Switch language';
  } else if (currentLang === 'pt') {
    flag = '🇧🇷';
    label = 'PT';
    title = 'Mudar idioma';
  }

  return (
    <button
      onClick={cycleLanguage}
      className="btn-lang-toggle"
      title={title}
      style={{
        background: 'var(--color-glass-bg, rgba(255,255,255,0.1))',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 8,
        padding: '6px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: 'inherit',
        fontSize: 14,
      }}
    >
      <span style={{ fontSize: 18 }}>{flag}</span>
      <span>{label}</span>
    </button>
  );
};

export default LanguageSwitcher;
