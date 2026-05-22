import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SpotlightSearch } from './components/SpotlightSearch';
import { QuickAppointmentModal } from './components/QuickAppointmentModal';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Agenda } from './pages/Agenda';
import { Pacientes } from './pages/Pacientes';
import { Procedimientos } from './pages/Procedimientos';
import { Doctores } from './pages/Doctores';
import { Caja } from './pages/Caja';
import { HistorialClinico } from './pages/HistorialClinico';
import { Reportes } from './pages/Reportes';
import { Configuracion } from './pages/Configuracion';

const MainAppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('Inicio');
  const [isQuickApptOpen, setIsQuickApptOpen] = useState(false);
  const { toasts, removeToast } = useApp();

  // Global search navigation callback
  const handleSpotlightNavigation = (module: string, param?: string) => {
    setActiveModule(module);
    if (module === 'Pacientes' && param) {
      // The state selected patient will be handled by the click inside Spotlight
      // We force page rerender. In a real-world setting we can pass parameter
    }
  };

  const renderActivePage = () => {
    switch (activeModule) {
      case 'Inicio':
        return <Dashboard onNavigateToModule={handleSpotlightNavigation} />;
      case 'Agenda':
        return <Agenda />;
      case 'Pacientes':
        return <Pacientes />;
      case 'Procedimientos':
        return <Procedimientos />;
      case 'Doctores':
        return <Doctores />;
      case 'Caja':
        return <Caja />;
      case 'Historial Clínico':
        return <HistorialClinico />;
      case 'Reportes':
        return <Reportes />;
      case 'Configuración':
        return <Configuracion />;
      default:
        return <Dashboard onNavigateToModule={handleSpotlightNavigation} />;
    }
  };

  return (
    <div className="app-container">
      {/* 1. Sidebar Nav */}
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

      {/* 2. Main Wrapper */}
      <div className="main-wrapper">
        
        {/* Header Tools */}
        <Header 
          activeModule={activeModule} 
          onQuickAppointmentClick={() => setIsQuickApptOpen(true)} 
        />

        {/* Dynamic Page Content */}
        <main className="page-content">
          {renderActivePage()}
        </main>
      </div>

      {/* 3. Global Spotlight Search Bar */}
      <SpotlightSearch onNavigate={handleSpotlightNavigation} />

      {/* 4. Global Quick Appointment Modal */}
      <QuickAppointmentModal 
        isOpen={isQuickApptOpen} 
        onClose={() => setIsQuickApptOpen(false)} 
      />

      {/* 5. Floating Toast Notifications stack */}
      <div className="toast-container">
        {toasts.map(toast => {
          let Icon = Info;
          if (toast.type === 'success') Icon = CheckCircle;
          else if (toast.type === 'warning') Icon = AlertTriangle;
          else if (toast.type === 'error') Icon = AlertCircle;
          
          return (
            <div key={toast.id} className={`toast ${toast.type}`}>
              <div className={`toast-icon-wrapper ${toast.type}`}>
                <Icon size={18} />
              </div>
              <div className="toast-message">{toast.message}</div>
              <button 
                className="toast-close-btn" 
                onClick={() => removeToast(toast.id)}
                title="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
