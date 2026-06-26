// frontend/src/components/TimezoneSelect.jsx
// Selector de zona horaria — l10n
// Detecta automáticamente la zona horaria del navegador.
// Muestra un reloj en tiempo real de la zona seleccionada.

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Zonas horarias IANA agrupadas por región
const TIMEZONE_GROUPS = [
  {
    region: 'América del Sur / South America / América do Sul',
    zones: [
      { value: 'America/Lima',                      label: 'Lima, Bogotá, Quito (UTC-5)' },
      { value: 'America/Bogota',                    label: 'Bogotá (UTC-5)' },
      { value: 'America/Caracas',                   label: 'Caracas (UTC-4)' },
      { value: 'America/La_Paz',                    label: 'La Paz (UTC-4)' },
      { value: 'America/Santiago',                  label: 'Santiago (UTC-3/-4)' },
      { value: 'America/Sao_Paulo',                 label: 'São Paulo (UTC-3)' },
      { value: 'America/Argentina/Buenos_Aires',    label: 'Buenos Aires (UTC-3)' },
      { value: 'America/Montevideo',                label: 'Montevideo (UTC-3)' },
    ]
  },
  {
    region: 'América Central y México / Central America & Mexico',
    zones: [
      { value: 'America/Mexico_City',   label: 'Ciudad de México (UTC-6)' },
      { value: 'America/Guatemala',     label: 'Guatemala (UTC-6)' },
      { value: 'America/El_Salvador',   label: 'San Salvador (UTC-6)' },
      { value: 'America/Costa_Rica',    label: 'San José (UTC-6)' },
      { value: 'America/Panama',        label: 'Panamá (UTC-5)' },
      { value: 'America/Havana',        label: 'La Habana (UTC-5)' },
      { value: 'America/Santo_Domingo', label: 'Santo Domingo (UTC-4)' },
    ]
  },
  {
    region: 'América del Norte / North America',
    zones: [
      { value: 'America/Chicago',      label: 'Chicago, Dallas (UTC-6)' },
      { value: 'America/New_York',     label: 'Nueva York, Miami (UTC-5)' },
      { value: 'America/Los_Angeles',  label: 'Los Ángeles, Seattle (UTC-8)' },
      { value: 'America/Denver',       label: 'Denver (UTC-7)' },
      { value: 'America/Toronto',      label: 'Toronto (UTC-5)' },
    ]
  },
  {
    region: 'Europa / Europe',
    zones: [
      { value: 'Europe/London',  label: 'Londres (UTC+0/+1)' },
      { value: 'Europe/Madrid',  label: 'Madrid, Barcelona (UTC+1/+2)' },
      { value: 'Europe/Paris',   label: 'París (UTC+1/+2)' },
      { value: 'Europe/Berlin',  label: 'Berlín (UTC+1/+2)' },
      { value: 'Europe/Lisbon',  label: 'Lisboa (UTC+0/+1)' },
    ]
  },
  {
    region: 'UTC',
    zones: [
      { value: 'UTC', label: 'UTC (UTC+0)' },
    ]
  }
];

// Comprueba si un timezone ya está en los grupos definidos
const isInGroups = (tz) =>
  TIMEZONE_GROUPS.some(g => g.zones.some(z => z.value === tz));

/**
 * Detecta la zona horaria del navegador de forma segura.
 * @returns {string} IANA timezone string, ej: 'America/Lima'
 */
export const detectBrowserTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'America/Lima';
  } catch {
    return 'America/Lima';
  }
};

const TimezoneSelect = ({ value, onChange, id = 'timezone', name = 'timezone', required = false }) => {
  const { t } = useTranslation();
  const [liveTime, setLiveTime] = useState('');
  const intervalRef = useRef(null);

  // Reloj en vivo — actualiza cada segundo
  useEffect(() => {
    const tick = () => {
      if (!value) { setLiveTime(''); return; }
      try {
        const time = new Intl.DateTimeFormat(undefined, {
          timeZone: value,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date());
        setLiveTime(time);
      } catch {
        setLiveTime('');
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [value]);

  // Construir los grupos. Si el timezone detectado no está en la lista, añadirlo primero.
  const detectedTz = detectBrowserTimezone();
  const showDetectedOption = value === detectedTz && !isInGroups(detectedTz);

  return (
    <div className="timezone-select-wrapper">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="form-control"
        required={required}
        aria-label={t('register.timezone')}
      >
        {/* Opción placeholder */}
        <option value="" disabled>{t('register.timezonePlaceholder')}</option>

        {/* Si el timezone detectado no está en los grupos, mostrarlo primero */}
        {showDetectedOption && (
          <optgroup label="🌐 Detectado / Detected">
            <option value={detectedTz}>{detectedTz} — {t('register.timezoneDetected')}</option>
          </optgroup>
        )}

        {TIMEZONE_GROUPS.map((group) => (
          <optgroup key={group.region} label={group.region}>
            {group.zones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {value && (
        <div className="timezone-preview">
          <span className="tz-clock-icon">🕐</span>
          <span className="tz-info">
            <strong>{value}</strong>
            {liveTime && <span className="tz-time"> · {liveTime}</span>}
          </span>
          <span className="tz-detected-badge">{t('register.timezoneDetected')}</span>
        </div>
      )}

      <p className="timezone-hint">{t('register.timezoneInfo')}</p>
    </div>
  );
};

export default TimezoneSelect;
