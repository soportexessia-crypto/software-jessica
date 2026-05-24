import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

// Interfaces
export interface BlockedRange {
  _id?: string;
  id?: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  reason: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  workingDays: string[]; // e.g. ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  workingHours: string; // e.g. "08:00 - 17:00"
  color: string;
  avatar: string;
  blockedRanges?: BlockedRange[];
}


export interface Procedure {
  id?: string;
  code: string;
  name: string;
  category: string;
  duration: number; // in minutes
  price: number; // in COP
  color: string;
  specialist: string; // Doctor id or "Todos"
  notes?: string;
  alert?: string; // Alert warning
  favorite?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  document: string;
  phone: string;
  whatsapp: string;
  address: string;
  birthDate: string;
  gender: 'Femenino' | 'Masculino' | 'Otro';
  email: string;
  eps: string;
  allergies: string;
  observations: string;
  photoUrl?: string;
  debt: number;
  companionPhone?: string;
  companionName?: string;
  odontogram: Record<number, Record<string, 'caries' | 'conducto' | 'corona' | 'none'>>; // toothNumber -> section -> state
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  procedureCode: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // in minutes
  status: 'confirmada' | 'pendiente' | 'cancelada' | 'enproceso' | 'finalizada';
  paymentStatus: 'pagado' | 'parcial' | 'deuda';
  paidAmount: number;
  discount?: number;
  notes?: string;
}

export interface FinancialRecord {
  id: string;
  patientId?: string;
  appointmentId?: string;
  date: string; // YYYY-MM-DD HH:MM
  amount: number;
  method: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Nequi' | 'Daviplata';
  type: 'Ingreso' | 'Egreso';
  notes?: string;
  receiptPhoto?: string; // Simulación de foto del comprobante (URL o base64)
}

export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AppContextType {
  doctors: Doctor[];
  procedures: Procedure[];
  patients: Patient[];
  appointments: Appointment[];
  financials: FinancialRecord[];
  currentRole: 'Secretaria' | 'Doctor' | 'Administrador';
  setCurrentRole: (role: 'Secretaria' | 'Doctor' | 'Administrador') => void;
  
  // Auth state
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshData: (isBackground?: boolean) => Promise<void>;
  
  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // Confirmations
  confirmConfig: ConfirmConfig | null;
  showConfirm: (config: ConfirmConfig | null) => void;
  
  // Actions
  addPatient: (patient: Omit<Patient, 'id' | 'debt' | 'odontogram'>) => Promise<Patient>;
  updatePatient: (id: string, patient: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  updateOdontogram: (
    patientId: string, 
    toothNumber: number | null, 
    section: string | null, 
    state: 'caries' | 'conducto' | 'corona' | 'none' | null,
    fullOdontogram?: Record<number, Record<string, 'caries' | 'conducto' | 'corona' | 'none'>>
  ) => Promise<void>;
  
  addProcedure: (procedure: Omit<Procedure, 'id'>) => Promise<Procedure>;
  updateProcedure: (id: string, procedure: Partial<Procedure>) => Promise<void>;
  deleteProcedure: (id: string) => Promise<void>;
  
  addAppointment: (appointment: Omit<Appointment, 'id' | 'paidAmount' | 'paymentStatus'> & { paidAmount?: number; paymentMethod?: string }) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  
  addFinancialRecord: (record: Omit<FinancialRecord, 'id' | 'date'> & { date?: string; receiptPhoto?: string }) => Promise<void>;
  
  addDoctor: (doc: Omit<Doctor, 'id' | 'avatar'>) => Promise<Doctor>;
  updateDoctor: (id: string, doc: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  
  // Quick Utilities
  getPatientById: (id: string) => Patient | undefined;
  getDoctorById: (id: string) => Doctor | undefined;
  getProcedureByCode: (code: string) => Procedure | undefined;
  
  // Search state
  spotlightOpen: boolean;
  setSpotlightOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<'Secretaria' | 'Doctor' | 'Administrador'>('Secretaria');
  const [spotlightOpen, setSpotlightOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);
  const showConfirm = (config: ConfirmConfig | null) => {
    setConfirmConfig(config);
  };
  
  // Auth & Connection states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Dynamic state arrays populated from Railway MongoDB Atlas
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Helper to load all clinical data from Railway cloud API
  const refreshData = async (isBackground = false) => {
    try {
      const [docsData, procsData, patsData, apptsData, finsData] = await Promise.all([
        api.get('/doctors'),
        api.get('/procedures'),
        api.get('/patients'),
        api.get('/appointments'),
        api.get('/financials')
      ]);

      setDoctors(docsData.map((d: any) => ({ ...d, id: d._id })));
      setProcedures(procsData.map((p: any) => ({ ...p, id: p._id })));
      setPatients(patsData.map((p: any) => ({ ...p, id: p._id })));
      setAppointments(apptsData.map((a: any) => ({ ...a, id: a._id })));
      setFinancials(finsData.map((f: any) => ({ ...f, id: f._id })));
    } catch (err: any) {
      console.error('Error refreshing data from server:', err);
      if (!isBackground) {
        showToast('Error de sincronización con la nube de XESSIA.', 'error');
      }
    }
  };

  // Validate existing session token on Mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('xessia_token');
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const user = await api.get('/auth/me');
        setCurrentRole(user.role);
        setIsAuthenticated(true);
        await refreshData();
      } catch (err) {
        console.error('Session validation failed:', err);
        localStorage.removeItem('xessia_token');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Periodic polling/refresh every 4 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      refreshData(true);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // Auth Operations
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      if (res && res.token) {
        localStorage.setItem('xessia_token', res.token);
        setCurrentRole(res.user.role);
        setIsAuthenticated(true);
        await refreshData();
        showToast(`¡Bienvenido al sistema administrativo!`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      showToast(err.message || 'Error de autenticación.', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('xessia_token');
    setIsAuthenticated(false);
    setCurrentRole('Secretaria');
    setDoctors([]);
    setProcedures([]);
    setPatients([]);
    setAppointments([]);
    setFinancials([]);
    showToast('Sesión cerrada correctamente.', 'info');
  };

  // ACTIONS IMPLEMENTATION WITH API CALLS
  const addPatient = async (newPat: Omit<Patient, 'id' | 'debt' | 'odontogram'>): Promise<Patient> => {
    try {
      const savedPat = await api.post('/patients', newPat);
      const mapped: Patient = { ...savedPat, id: savedPat._id };
      setPatients(prev => [mapped, ...prev]);
      showToast('Paciente registrado correctamente', 'success');
      return mapped;
    } catch (err: any) {
      showToast(err.message || 'Error al guardar paciente', 'error');
      throw err;
    }
  };

  const updatePatient = async (id: string, updatedFields: Partial<Patient>): Promise<void> => {
    try {
      const savedPat = await api.patch(`/patients/${id}`, updatedFields);
      const mapped: Patient = { ...savedPat, id: savedPat._id };
      setPatients(prev => prev.map(p => p.id === id ? mapped : p));
      showToast('Paciente actualizado correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar paciente', 'error');
      throw err;
    }
  };

  const deletePatient = async (id: string): Promise<void> => {
    try {
      await api.delete(`/patients/${id}`);
      setPatients(prev => prev.filter(p => p.id !== id));
      // Soft-cancel pending appointments in local state
      setAppointments(prev => prev.map(appt => appt.patientId === id ? { ...appt, status: 'cancelada' as const } : appt));
      showToast('Paciente eliminado correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar paciente', 'error');
      throw err;
    }
  };



  const updateOdontogram = async (
    patientId: string,
    toothNumber: number | null,
    section: string | null,
    state: 'caries' | 'conducto' | 'corona' | 'none' | null,
    fullOdontogram?: Record<number, Record<string, 'caries' | 'conducto' | 'corona' | 'none'>>
  ): Promise<void> => {
    try {
      const payload = fullOdontogram 
        ? { odontogram: fullOdontogram }
        : { toothNumber, section, state };
      const updatedPat = await api.patch(`/patients/${patientId}/odontogram`, payload);
      const mapped: Patient = { ...updatedPat, id: updatedPat._id };
      setPatients(prev => prev.map(p => p.id === patientId ? mapped : p));
      showToast(fullOdontogram ? 'Odontograma guardado correctamente' : `Diente ${toothNumber} guardado en la nube`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar odontograma', 'error');
      throw err;
    }
  };

  const addAppointment = async (newAppt: Omit<Appointment, 'id' | 'paidAmount' | 'paymentStatus'> & { paidAmount?: number; paymentMethod?: string }): Promise<void> => {
    try {
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const savedAppt = await api.post('/appointments', { ...newAppt, localDate });
      const mapped: Appointment = { ...savedAppt, id: savedAppt._id };
      setAppointments(prev => [mapped, ...prev]);
      
      // Recargar para impactar el aumento de deuda en pacientes
      await refreshData();
      showToast('Cita agendada correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al registrar cita', 'error');
      throw err;
    }
  };

  const updateAppointment = async (id: string, updatedFields: Partial<Appointment>): Promise<void> => {
    try {
      const savedAppt = await api.patch(`/appointments/${id}`, updatedFields);
      const mapped: Appointment = { ...savedAppt, id: savedAppt._id };
      setAppointments(prev => prev.map(appt => appt.id === id ? mapped : appt));
      
      // Recargar para impactar el flujo de deudas del paciente
      await refreshData();
      showToast('Cita modificada con éxito', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar cita', 'error');
      throw err;
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.map(appt => appt.id === id ? { ...appt, status: 'cancelada' as const } : appt));
      await refreshData();
      showToast('Cita cancelada con éxito', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar cita', 'error');
      throw err;
    }
  };

  const addFinancialRecord = async (newRecord: Omit<FinancialRecord, 'id' | 'date'> & { date?: string }): Promise<void> => {
    try {
      const now = new Date();
      const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const savedFin = await api.post('/financials', { ...newRecord, date: newRecord.date || localDate });
      const mapped: FinancialRecord = { ...savedFin, id: savedFin._id };
      setFinancials(prev => [mapped, ...prev]);
      
      // Recargar para impactar la disminución de deuda del paciente en la agenda
      await refreshData();
      showToast('Transacción de caja registrada', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al registrar transacción', 'error');
      throw err;
    }
  };

  const addDoctor = async (newDoc: Omit<Doctor, 'id' | 'avatar'>): Promise<Doctor> => {
    try {
      const cleanName = newDoc.name.replace(/^(Dr\.|Dra\.)\s+/i, '').trim();
      const parts = cleanName.split(/\s+/);
      const avatar = parts.length > 1 
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
      
      const savedDoc = await api.post('/doctors', { ...newDoc, avatar });
      const mapped: Doctor = { ...savedDoc, id: savedDoc._id };
      setDoctors(prev => [...prev, mapped]);
      showToast('Especialista registrado correctamente', 'success');
      return mapped;
    } catch (err: any) {
      showToast(err.message || 'Error al guardar especialista', 'error');
      throw err;
    }
  };

  const updateDoctor = async (id: string, updatedFields: Partial<Doctor>): Promise<void> => {
    try {
      let avatarUpdate = {};
      if (updatedFields.name) {
        const cleanName = updatedFields.name.replace(/^(Dr\.|Dra\.)\s+/i, '').trim();
        const parts = cleanName.split(/\s+/);
        const avatar = parts.length > 1 
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : parts[0].substring(0, 2).toUpperCase();
        avatarUpdate = { avatar };
      }
      
      const savedDoc = await api.patch(`/doctors/${id}`, { ...updatedFields, ...avatarUpdate });
      const mapped: Doctor = { ...savedDoc, id: savedDoc._id };
      setDoctors(prev => prev.map(d => d.id === id ? mapped : d));
      showToast('Especialista actualizado correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar especialista', 'error');
      throw err;
    }
  };

  const deleteDoctor = async (id: string): Promise<void> => {
    try {
      await api.delete(`/doctors/${id}`);
      setDoctors(prev => prev.filter(d => d.id !== id));
      showToast('Especialista desactivado correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al desactivar especialista', 'error');
      throw err;
    }
  };

  const addProcedure = async (newProc: Omit<Procedure, 'id'>): Promise<Procedure> => {
    try {
      const savedProc = await api.post('/procedures', newProc);
      const mapped: Procedure = { ...savedProc, id: savedProc._id };
      setProcedures(prev => [...prev, mapped]);
      showToast('Tratamiento registrado correctamente', 'success');
      return mapped;
    } catch (err: any) {
      showToast(err.message || 'Error al guardar tratamiento', 'error');
      throw err;
    }
  };

  const updateProcedure = async (id: string, updatedFields: Partial<Procedure>): Promise<void> => {
    try {
      const savedProc = await api.patch(`/procedures/${id}`, updatedFields);
      const mapped: Procedure = { ...savedProc, id: savedProc._id };
      setProcedures(prev => prev.map(p => p.id === id ? mapped : p));
      showToast('Tratamiento actualizado correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar tratamiento', 'error');
      throw err;
    }
  };

  const deleteProcedure = async (id: string): Promise<void> => {
    try {
      await api.delete(`/procedures/${id}`);
      setProcedures(prev => prev.filter(p => p.id !== id));
      showToast('Tratamiento eliminado correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar tratamiento', 'error');
      throw err;
    }
  };

  const getPatientById = (id: string) => patients.find(p => p.id === id);
  const getDoctorById = (id: string) => doctors.find(d => d.id === id);
  const getProcedureByCode = (code: string) => procedures.find(pr => pr.code === code);

  return (
    <AppContext.Provider value={{
      doctors,
      procedures,
      patients,
      appointments,
      financials,
      currentRole,
      setCurrentRole,
      
      isAuthenticated,
      loading,
      login,
      logout,
      refreshData,
      
      toasts,
      showToast,
      removeToast,
      confirmConfig,
      showConfirm,
      addPatient,
      updatePatient,
      deletePatient,
      updateOdontogram,
      
      addProcedure,
      updateProcedure,
      deleteProcedure,
      
      addAppointment,
      updateAppointment,
      deleteAppointment,
      
      addFinancialRecord,
      
      addDoctor,
      updateDoctor,
      deleteDoctor,
      
      getPatientById,
      getDoctorById,
      getProcedureByCode,
      
      spotlightOpen,
      setSpotlightOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
