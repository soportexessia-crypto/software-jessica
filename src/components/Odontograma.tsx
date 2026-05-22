import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Info } from 'lucide-react';

interface OdontogramaProps {
  patientId: string;
}

export const Odontograma: React.FC<OdontogramaProps> = ({ patientId }) => {
  const { getPatientById, updateOdontogram } = useApp();
  const patient = getPatientById(patientId);

  const [activeTool, setActiveTool] = useState<'caries' | 'conducto' | 'corona' | 'none'>('caries');
  const [viewMode, setViewMode] = useState<'adulto' | 'infantil'>('adulto');

  if (!patient) return <div>Cargando paciente...</div>;

  // Tooth lists based on international numbering
  const upperAdultTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerAdultTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  
  const upperChildTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
  const lowerChildTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

  const handleSectionClick = (toothNum: number, section: string) => {
    // Apply currently active tool to that section
    updateOdontogram(patientId, toothNum, section, activeTool);
  };

  const getSectionClass = (toothNum: number, section: string) => {
    const toothData = patient.odontogram[toothNum];
    if (!toothData) return 'tooth-section';
    const state = toothData[section];
    if (state === 'caries') return 'tooth-section caries';
    if (state === 'conducto') return 'tooth-section conducto';
    if (state === 'corona') return 'tooth-section corona';
    return 'tooth-section';
  };

  // Renders a single tooth with 5 clickable sections in SVG
  const renderTooth = (num: number) => {
    return (
      <div key={num} className="tooth-item">
        <span className="tooth-number">{num}</span>
        <svg viewBox="0 0 40 40" className="tooth-svg">
          {/* Top (Vestibular) */}
          <polygon
            points="0,0 40,0 28,12 12,12"
            className={getSectionClass(num, 'vestibular')}
            onClick={() => handleSectionClick(num, 'vestibular')}
          />
          {/* Right (Distal/Mesial depending on mouth half) */}
          <polygon
            points="40,0 28,12 28,28 40,40"
            className={getSectionClass(num, 'distal')}
            onClick={() => handleSectionClick(num, 'distal')}
          />
          {/* Bottom (Palatino/Lingual) */}
          <polygon
            points="12,28 28,28 40,40 0,40"
            className={getSectionClass(num, 'palatina')}
            onClick={() => handleSectionClick(num, 'palatina')}
          />
          {/* Left (Mesial/Distal) */}
          <polygon
            points="0,0 12,12 12,28 0,40"
            className={getSectionClass(num, 'mesial')}
            onClick={() => handleSectionClick(num, 'mesial')}
          />
          {/* Center (Oclusal) */}
          <polygon
            points="12,12 28,12 28,28 12,28"
            className={getSectionClass(num, 'oclusal')}
            onClick={() => handleSectionClick(num, 'oclusal')}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="odontograma-container">
      <div 
        style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px', 
          borderBottom: '1px solid var(--border-light)', 
          paddingBottom: '16px', 
          marginBottom: '16px' 
        }}
      >
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Odontograma Clínico Interactivo
        </h3>
        
        {/* Toggle Adulto/Infantil */}
        <div className="calendar-view-selector" style={{ margin: 0 }}>
          <button 
            type="button" 
            className={`calendar-view-btn ${viewMode === 'adulto' ? 'active' : ''}`}
            onClick={() => setViewMode('adulto')}
          >
            Dentadura Adulta
          </button>
          <button 
            type="button" 
            className={`calendar-view-btn ${viewMode === 'infantil' ? 'active' : ''}`}
            onClick={() => setViewMode('infantil')}
          >
            Dentadura Infantil
          </button>
        </div>
      </div>

      {/* Toolbox */}
      <div 
        style={{ 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          flexWrap: 'wrap', 
          padding: '12px', 
          backgroundColor: 'var(--bg-app)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-light)',
          marginBottom: '20px' 
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginRight: '8px' }}>
          PALETA DE DIAGNÓSTICO:
        </div>
        
        <button 
          type="button"
          className="btn"
          style={{ 
            padding: '6px 12px', 
            fontSize: '12px', 
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTool === 'caries' ? 'var(--state-cancelada-bg)' : 'white',
            color: 'var(--state-cancelada)',
            border: `1px solid ${activeTool === 'caries' ? 'var(--state-cancelada)' : 'var(--border-light)'}`
          }}
          onClick={() => setActiveTool('caries')}
        >
          Caries (Rojo)
        </button>

        <button 
          type="button"
          className="btn"
          style={{ 
            padding: '6px 12px', 
            fontSize: '12px', 
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTool === 'conducto' ? 'var(--state-enproceso-bg)' : 'white',
            color: 'var(--state-enproceso)',
            border: `1px solid ${activeTool === 'conducto' ? 'var(--state-enproceso)' : 'var(--border-light)'}`
          }}
          onClick={() => setActiveTool('conducto')}
        >
          Endodoncia (Azul)
        </button>

        <button 
          type="button"
          className="btn"
          style={{ 
            padding: '6px 12px', 
            fontSize: '12px', 
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTool === 'corona' ? 'var(--state-pendiente-bg)' : 'white',
            color: 'var(--state-pendiente)',
            border: `1px solid ${activeTool === 'corona' ? 'var(--state-pendiente)' : 'var(--border-light)'}`
          }}
          onClick={() => setActiveTool('corona')}
        >
          Corona/Implante (Amarillo)
        </button>

        <button 
          type="button"
          className="btn"
          style={{ 
            padding: '6px 12px', 
            fontSize: '12px', 
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTool === 'none' ? 'var(--bg-hover)' : 'white',
            color: 'var(--text-main)',
            border: `1px solid ${activeTool === 'none' ? 'var(--text-main)' : 'var(--border-light)'}`
          }}
          onClick={() => setActiveTool('none')}
        >
          Limpiar Cara
        </button>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '10px' }}>
        <div style={{ minWidth: '940px', display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
          
          {/* Upper Arch */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
              Arcada Superior
            </div>
            <div className="tooth-grid" style={{ gridTemplateColumns: viewMode === 'adulto' ? 'repeat(16, 1fr)' : 'repeat(10, 1fr)', justifyContent: 'center' }}>
              {viewMode === 'adulto' 
                ? upperAdultTeeth.map(num => renderTooth(num))
                : upperChildTeeth.map(num => renderTooth(num))
              }
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-light)' }}></div>

          {/* Lower Arch */}
          <div>
            <div className="tooth-grid" style={{ gridTemplateColumns: viewMode === 'adulto' ? 'repeat(16, 1fr)' : 'repeat(10, 1fr)', justifyContent: 'center' }}>
              {viewMode === 'adulto' 
                ? lowerAdultTeeth.map(num => renderTooth(num))
                : lowerChildTeeth.map(num => renderTooth(num))
              }
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginTop: '8px', textAlign: 'center' }}>
              Arcada Inferior
            </div>
          </div>

        </div>
      </div>

      <div 
        style={{ 
          marginTop: '20px', 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '8px', 
          backgroundColor: 'var(--bg-hover)', 
          border: '1px solid var(--border-light)',
          padding: '10px 14px', 
          borderRadius: 'var(--radius-md)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          width: '100%'
        }}
      >
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--text-light)' }} />
        <div>
          <strong>Instrucciones:</strong> Seleccione una herramienta en la paleta diagnóstica superior (ej. Caries) y luego haga clic directamente sobre una de las 5 caras de cualquier diente para colorearlo. El cambio se guarda automáticamente.
        </div>
      </div>
    </div>
  );
};
