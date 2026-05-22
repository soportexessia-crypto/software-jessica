import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Credenciales incorrectas o usuario inactivo.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-glow">
        <div className="glow-circle glow-1"></div>
        <div className="glow-circle glow-2"></div>
      </div>

      <div className="login-card-wrapper">
        <div className="login-header-logo">
          <img src="img/Logo.png" alt="Xessia Logo" className="login-logo-img" />
          <h1 className="login-brand-name">XESSIA</h1>
          <p className="login-subtitle">Gestión Odontológica Inteligente</p>
        </div>

        <div className="login-card">
          <h2 className="login-title">Iniciar Sesión</h2>
          <p className="login-desc">Introduce tus credenciales para acceder al sistema administrativo.</p>

          {error && (
            <div className="login-error-alert">
              <Shield size={16} className="error-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  placeholder="ejemplo@xessia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Ingresando al sistema...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p>© {new Date().getFullYear()} XESSIA. Todos los derechos reservados.</p>
          <p className="footer-version">Versión 1.0.0 (MongoDB Atlas Cloud)</p>
        </div>
      </div>
    </div>
  );
};
