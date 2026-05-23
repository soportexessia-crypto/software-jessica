import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeModule: string;
  onQuickAppointmentClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeModule, onQuickAppointmentClick }) => {
  const { 
    setSpotlightOpen 
  } = useApp();

  return (
    <header className="app-header">
      {/* Brand & Module Title */}
      <div className="header-brand-container">
        {/* Mobile-only brand identifier */}
        <div className="header-mobile-brand">
          <img 
            src="img/Logo.png" 
            alt="XESSIA" 
            className="header-mobile-logo"
          />
          <span className="header-mobile-brand-name">XESSIA</span>
          <span className="header-mobile-separator">|</span>
        </div>
        <h1 className="header-module-title">{activeModule}</h1>
      </div>

      {/* Global Spotight Search Bar trigger */}
      <div className="header-left">
        <button 
          className="search-trigger" 
          onClick={() => setSpotlightOpen(true)}
        >
          <Search size={16} />
          <span className="hide-mobile">Buscar pacientes, doctores, tratamientos...</span>
          <span className="search-shortcut hide-mobile">Ctrl + K</span>
        </button>
      </div>

      {/* Right Tools: Role Selector and Quick Appointment */}
      <div className="header-right">
        {/* Role Switcher for demonstration purposes */}
        <div className="role-selector-container hide-mobile" style={{ backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 700 }}>Secretaria</span>
        </div>

        {/* Quick Appt Button */}
        <button 
          className="btn-quick-appointment" 
          onClick={onQuickAppointmentClick}
        >
          <Plus size={16} />
          <span>Cita Rápida</span>
        </button>
      </div>
    </header>
  );
};
