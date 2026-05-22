import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Search, User, Stethoscope, DollarSign, X, Star } from 'lucide-react';

interface SpotlightSearchProps {
  onNavigate: (module: string, param?: string) => void;
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ onNavigate }) => {
  const { spotlightOpen, setSpotlightOpen, patients, doctors, procedures } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Toggle open on Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen(!spotlightOpen);
      }
      if (e.key === 'Escape' && spotlightOpen) {
        setSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spotlightOpen, setSpotlightOpen]);

  // Focus input when opened
  useEffect(() => {
    if (spotlightOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [spotlightOpen]);

  if (!spotlightOpen) return null;

  // Search logic
  const normalizedQuery = query.toLowerCase().trim();
  
  const filteredPatients = query
    ? patients.filter(p => 
        p.name.toLowerCase().includes(normalizedQuery) || 
        p.document.includes(normalizedQuery) ||
        p.phone.includes(normalizedQuery)
      ).slice(0, 3)
    : patients.slice(0, 2); // Default suggestions

  const filteredDoctors = query
    ? doctors.filter(d => 
        d.name.toLowerCase().includes(normalizedQuery) || 
        d.specialty.toLowerCase().includes(normalizedQuery)
      ).slice(0, 2)
    : doctors.slice(0, 2);

  const filteredProcedures = query
    ? procedures.filter(pr => 
        pr.name.toLowerCase().includes(normalizedQuery) || 
        pr.code.toLowerCase().includes(normalizedQuery) ||
        pr.category.toLowerCase().includes(normalizedQuery)
      ).slice(0, 3)
    : procedures.filter(p => p.favorite).slice(0, 2);

  const handleSelect = (module: string, id?: string) => {
    setSpotlightOpen(false);
    onNavigate(module, id);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      setSpotlightOpen(false);
    }
  };

  return (
    <div className="spotlight-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="spotlight-content fade-in">
        <div className="spotlight-input-container">
          <Search size={20} className="text-muted" />
          <input
            ref={inputRef}
            type="text"
            className="spotlight-input"
            placeholder="Buscar pacientes, doctores, tratamientos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="close-btn" onClick={() => setSpotlightOpen(false)}>
            <X size={18} />
          </button>
        </div>
        
        <div className="spotlight-results">
          {/* Patients Group */}
          <div>
            <div className="spotlight-group-title">Pacientes</div>
            {filteredPatients.length > 0 ? (
              filteredPatients.map(p => (
                <div 
                  key={p.id} 
                  className="spotlight-item"
                  onClick={() => handleSelect('Pacientes', p.id)}
                >
                  <User size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div className="spotlight-item-title">{p.name}</div>
                    <div className="spotlight-item-subtitle">C.C. {p.document} • Tlf: {p.phone}</div>
                  </div>
                  {p.debt > 0 && (
                    <span className="badge badge-cancelada" style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px' }}>
                      Deuda: ${p.debt.toLocaleString('es-CO')}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-muted" style={{ padding: '8px 12px', fontSize: '12px' }}>No se encontraron pacientes</div>
            )}
          </div>

          {/* Doctors Group */}
          <div style={{ marginTop: '12px' }}>
            <div className="spotlight-group-title">Doctores / Especialistas</div>
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map(d => (
                <div 
                  key={d.id} 
                  className="spotlight-item"
                  onClick={() => handleSelect('Doctores', d.id)}
                >
                  <Stethoscope size={16} style={{ color: 'var(--accent)' }} />
                  <div>
                    <div className="spotlight-item-title">{d.name}</div>
                    <div className="spotlight-item-subtitle">{d.specialty} • {d.workingHours}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted" style={{ padding: '8px 12px', fontSize: '12px' }}>No se encontraron especialistas</div>
            )}
          </div>

          {/* Procedures Group */}
          <div style={{ marginTop: '12px' }}>
            <div className="spotlight-group-title">Procedimientos y Tratamientos</div>
            {filteredProcedures.length > 0 ? (
              filteredProcedures.map(pr => (
                <div 
                  key={pr.code} 
                  className="spotlight-item"
                  onClick={() => handleSelect('Procedimientos', pr.code)}
                >
                  <DollarSign size={16} style={{ color: 'var(--state-confirmada)' }} />
                  <div>
                    <div className="spotlight-item-title">{pr.name}</div>
                    <div className="spotlight-item-subtitle">{pr.category} • {pr.duration} min • ${pr.price.toLocaleString('es-CO')}</div>
                  </div>
                  {pr.favorite && (
                    <Star size={14} fill="currentColor" style={{ marginLeft: 'auto', color: 'var(--state-pendiente)' }} />
                  )}
                </div>
              ))
            ) : (
              <div className="text-muted" style={{ padding: '8px 12px', fontSize: '12px' }}>No se encontraron procedimientos</div>
            )}
          </div>
        </div>
        
        <div 
          style={{ 
            padding: '8px 16px', 
            borderTop: '1px solid var(--border-light)', 
            backgroundColor: 'var(--bg-hover)', 
            fontSize: '11px', 
            color: 'var(--text-light)', 
            display: 'flex', 
            justifyContent: 'space-between' 
          }}
        >
          <span>Escriba para buscar...</span>
          <span>Presione <kbd style={{ background: 'white', padding: '1px 3px', border: '1px solid var(--border-light)', borderRadius: '3px' }}>Esc</kbd> para cerrar</span>
        </div>
      </div>
    </div>
  );
};
