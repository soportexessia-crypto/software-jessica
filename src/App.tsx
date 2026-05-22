import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SpotlightSearch } from './components/SpotlightSearch';
import { QuickAppointmentModal } from './components/QuickAppointmentModal';
import { Login } from './components/Login';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X, Download, Laptop, Smartphone } from 'lucide-react';

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
  const { toasts, removeToast, isAuthenticated, loading } = useApp();

  const CLIENT_VERSION = '1.0.0';
  const [checkingVersion, setCheckingVersion] = useState(true);
  const [isForceUpdateRequired, setIsForceUpdateRequired] = useState(false);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [versionConfig, setVersionConfig] = useState<any>(null);

  React.useEffect(() => {
    const isVersionLower = (current: string, target: string): boolean => {
      const currentParts = current.split('.').map(Number);
      const targetParts = target.split('.').map(Number);
      for (let i = 0; i < Math.max(currentParts.length, targetParts.length); i++) {
        const c = currentParts[i] || 0;
        const t = targetParts[i] || 0;
        if (c < t) return true;
        if (c > t) return false;
      }
      return false;
    };

    const checkVersion = async (isPoll = false) => {
      try {
        const { api } = await import('./services/api');
        const config = await api.get('/system/version');
        setVersionConfig(config);

        if (isVersionLower(CLIENT_VERSION, config.minVersion)) {
          setIsForceUpdateRequired(true);
        } else if (isVersionLower(CLIENT_VERSION, config.latestVersion)) {
          // Si detectamos una versión superior a la cargada en memoria, disparamos la actualización en caliente
          setIsLiveUpdating(true);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      } catch (err) {
        console.warn('Fallo en verificación de versión (modo offline o servidor inaccesible):', err);
      } finally {
        if (!isPoll) {
          setCheckingVersion(false);
        }
      }
    };

    // Consultar de inmediato al iniciar
    checkVersion();

    // Sondeo periódico cada 45 segundos para detectar nuevos deploys en Railway en caliente
    const intervalId = setInterval(() => {
      checkVersion(true);
    }, 45000);

    return () => clearInterval(intervalId);
  }, []);

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

  if (loading || checkingVersion || isLiveUpdating) {
    return (
      <div className="app-loading-screen">
        <img src="img/Logo.png" alt="XESSIA" className="app-loading-logo" />
        <div className="app-loading-spinner"></div>
        <div className="app-loading-text">
          {isLiveUpdating 
            ? 'Nueva versión de XESSIA detectada. Aplicando actualizaciones en vivo...' 
            : 'Conectando a XESSIA Cloud...'}
        </div>
      </div>
    );
  }

  if (isForceUpdateRequired && versionConfig) {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(userAgent);
    const isWindows = /windows/i.test(userAgent);

    return (
      <div className="update-block-screen">
        <div className="update-block-container">
          <img src="img/Logo.png" alt="XESSIA" className="update-block-logo" />
          
          <div className="update-block-icon">
            <AlertTriangle size={32} />
          </div>

          <h2 className="update-block-title">Actualización Obligatoria</h2>
          
          <p className="update-block-desc">
            Hemos realizado mejoras críticas de seguridad y rendimiento en XESSIA Cloud. 
            Para continuar garantizando la integridad de tus datos clínicos, debes actualizar la aplicación.
          </p>

          <div className="update-block-versions">
            <div className="update-version-tag current">
              Versión instalada: <strong>v{CLIENT_VERSION}</strong>
            </div>
            <div className="update-version-divider"></div>
            <div className="update-version-tag required">
              Versión requerida: <strong>v{versionConfig.minVersion}</strong>
            </div>
          </div>

          <div className="update-download-grid">
            {/* Windows Download Card */}
            <div 
              className={`update-download-card ${isWindows ? 'recommended' : ''}`}
              onClick={() => window.open(versionConfig.downloadWindows, '_blank')}
            >
              {isWindows && (
                <span className="update-recommendation-badge">PC de la Clínica</span>
              )}
              <div className="update-card-icon">
                <Laptop size={24} />
              </div>
              <h3 className="update-card-title">XESSIA para Windows</h3>
              <p className="update-card-desc">
                Instalador ejecutable de escritorio (.exe) optimizado para el computador principal.
              </p>
              <button className="update-download-btn">
                <Download size={14} /> Descargar para PC
              </button>
            </div>

            {/* Android Download Card */}
            <div 
              className={`update-download-card ${isAndroid ? 'recommended' : ''}`}
              onClick={() => window.open(versionConfig.downloadAndroid, '_blank')}
            >
              {isAndroid && (
                <span className="update-recommendation-badge">Celular de la Clínica</span>
              )}
              <div className="update-card-icon">
                <Smartphone size={24} />
              </div>
              <h3 className="update-card-title">XESSIA para Android</h3>
              <p className="update-card-desc">
                Paquete de aplicación nativa (.apk) optimizado para dispositivos móviles y tablets.
              </p>
              <button className="update-download-btn">
                <Download size={14} /> Descargar APK
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Login />
        {/* Floating Toast Notifications stack */}
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
      </>
    );
  }

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
