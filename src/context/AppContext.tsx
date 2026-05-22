import React, { createContext, useState, useContext, useEffect } from 'react';

// Interfaces
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  workingDays: string[]; // e.g. ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  workingHours: string; // e.g. "08:00 - 17:00"
  color: string;
  avatar: string;
}

export interface Procedure {
  code: string;
  name: string;
  category: 'CONSULTAS' | 'LIMPIEZA Y PREVENCIÓN' | 'RADIOLOGÍA' | 'ORTODONCIA' | 'CIRUGÍA' | 'RESTAURACIÓN Y ESTÉTICA' | 'PRÓTESIS Y REHABILITACIÓN';
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
  
  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Actions
  addPatient: (patient: Omit<Patient, 'id' | 'debt' | 'odontogram'>) => Patient;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  updateOdontogram: (patientId: string, toothNumber: number, section: string, state: 'caries' | 'conducto' | 'corona' | 'none') => void;
  
  addAppointment: (appointment: Omit<Appointment, 'id' | 'paidAmount' | 'paymentStatus'>) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  
  addFinancialRecord: (record: Omit<FinancialRecord, 'id' | 'date'> & { date?: string }) => void;
  
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

  // 1. Initial State: DOCTORS
  const [doctors] = useState<Doctor[]>([
    { id: 'doc-1', name: 'Dra. Valentina Gómez', specialty: 'Ortodoncia', workingDays: ['Lunes', 'Martes', 'Miércoles', 'Viernes'], workingHours: '08:00 - 16:00', color: '#0f766e', avatar: 'VG' },
    { id: 'doc-2', name: 'Dr. Carlos Mendoza', specialty: 'Cirugía Oral & Implantes', workingDays: ['Martes', 'Miércoles', 'Jueves'], workingHours: '09:00 - 18:00', color: '#1e3a8a', avatar: 'CM' },
    { id: 'doc-3', name: 'Dra. Camila Restrepo', specialty: 'Estética & Rehabilitación', workingDays: ['Lunes', 'Jueves', 'Viernes'], workingHours: '08:00 - 17:00', color: '#4338ca', avatar: 'CR' },
    { id: 'doc-4', name: 'Dr. Andrés Felipe Ortiz', specialty: 'Odontopediatría & Integral', workingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], workingHours: '07:30 - 16:30', color: '#0369a1', avatar: 'AO' },
  ]);

  // 2. Initial State: PROCEDURES
  const [procedures] = useState<Procedure[]>([
    { code: 'LIMP-01', name: 'Limpieza Dental Profunda + Profilaxis', category: 'LIMPIEZA Y PREVENCIÓN', duration: 45, price: 120000, color: 'verde', specialist: 'Todos', favorite: true },
    { code: 'CONT-10', name: 'Control de Ortodoncia Técnica Roth', category: 'ORTODONCIA', duration: 30, price: 90000, color: 'azul', specialist: 'doc-1', favorite: true },
    { code: 'RES-01', name: 'Resina Estética Fotocurable', category: 'RESTAURACIÓN Y ESTÉTICA', duration: 45, price: 150000, color: 'amarillo', specialist: 'Todos', favorite: true },
    
    { code: 'DIAG-01', name: 'Consulta Primera Vez + Diagnóstico', category: 'CONSULTAS', duration: 30, price: 50000, color: 'gris', specialist: 'Todos' },
    { code: 'RX-01', name: 'Rayos X Periapical Interproximal', category: 'RADIOLOGÍA', duration: 15, price: 45000, color: 'azul', specialist: 'Todos', alert: 'Este procedimiento requiere que el paciente use chaleco de plomo protector.' },
    { code: 'CIR-02', name: 'Extracción Quirúrgica de Tercer Molar', category: 'CIRUGÍA', duration: 60, price: 350000, color: 'rojo', specialist: 'doc-2', alert: 'Requiere radiografía periapical o panorámica reciente.' },
    { code: 'BLANQ-01', name: 'Blanqueamiento Dental Clínico Láser', category: 'LIMPIEZA Y PREVENCIÓN', duration: 60, price: 480000, color: 'verde', specialist: 'doc-3' },
    { code: 'PROT-03', name: 'Colocación Prótesis Flexible de 3 Elementos', category: 'PRÓTESIS Y REHABILITACIÓN', duration: 90, price: 1200000, color: 'gris', specialist: 'doc-3', alert: 'Requiere toma previa de impresiones de silicona.' },
  ]);

  // 3. Initial State: PATIENTS
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 'pat-1',
      name: 'María Camila Restrepo Cardona',
      document: '1020493821',
      phone: '+57 312 849 5723',
      whatsapp: '573128495723',
      address: 'Calle 10 # 43A - 25, El Poblado, Medellín',
      birthDate: '1995-08-15',
      gender: 'Femenino',
      email: 'm.camila.restrepo@gmail.com',
      eps: 'EPS SURA',
      allergies: 'Penicilina y derivados',
      observations: 'Paciente con ortodoncia activa. Extremadamente puntual.',
      debt: 0,
      odontogram: {
        11: { vestibular: 'caries', palatina: 'none', distal: 'none', mesial: 'none', oclusal: 'none' },
        14: { vestibular: 'none', palatina: 'none', distal: 'none', mesial: 'none', oclusal: 'conducto' },
        26: { vestibular: 'none', palatina: 'none', distal: 'none', mesial: 'none', oclusal: 'corona' },
      }
    },
    {
      id: 'pat-2',
      name: 'Juan Sebastián Montoya Ruiz',
      document: '71293847',
      phone: '+57 315 284 9472',
      whatsapp: '573152849472',
      address: 'Carrera 48 # 26 Sur - 84, Envigado',
      birthDate: '1988-12-03',
      gender: 'Masculino',
      email: 'juan.montoya88@gmail.com',
      eps: 'Sanitas EPS',
      allergies: 'Ninguna conocida',
      observations: 'Requiere abonos en efectivo debido a subsidio empresarial.',
      debt: 150000,
      odontogram: {}
    },
    {
      id: 'pat-3',
      name: 'Lucía Fernanda Tobón Castro',
      document: '1039482910',
      phone: '+57 320 482 9182',
      whatsapp: '573204829182',
      address: 'Calle 77 Sur # 40 - 12, Sabaneta',
      birthDate: '2001-04-22',
      gender: 'Femenino',
      email: 'lu.tobonc@outlook.com',
      eps: 'Colsanitas Medicina Prepagada',
      allergies: 'Ninguna conocida',
      observations: 'Paciente ansiosa ante los ruidos del taladro, requiere manejo de relajación.',
      debt: 0,
      odontogram: {}
    },
    {
      id: 'pat-4',
      name: 'Samuel Alejandro Giraldo Marín',
      document: '1048291830',
      phone: '+57 301 928 3746',
      whatsapp: '573019283746',
      address: 'Circular 4 # 73 - 10, Laureles, Medellín',
      birthDate: '2016-09-10',
      gender: 'Masculino',
      email: 'andrea.marin.mama@hotmail.com',
      eps: 'Compensar EPS',
      allergies: 'Alergia al polen',
      observations: 'Hijo de Andrea Marín. Asiste a consulta integral infantil.',
      debt: 0,
      odontogram: {
        51: { vestibular: 'caries', palatina: 'none', distal: 'none', mesial: 'none', oclusal: 'none' },
      }
    }
  ]);

  // Helper to format today's date in YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format other dates
  const getOffsetDateString = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 4. Initial State: APPOINTMENTS
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const today = getTodayDateString();
    const tomorrow = getOffsetDateString(1);
    const yesterday = getOffsetDateString(-1);

    setAppointments([
      {
        id: 'appt-1',
        patientId: 'pat-1',
        doctorId: 'doc-1',
        procedureCode: 'CONT-10',
        date: today,
        time: '08:30',
        duration: 30,
        status: 'finalizada',
        paymentStatus: 'pagado',
        paidAmount: 90000
      },
      {
        id: 'appt-2',
        patientId: 'pat-2',
        doctorId: 'doc-2',
        procedureCode: 'CIR-02',
        date: today,
        time: '10:00',
        duration: 60,
        status: 'enproceso',
        paymentStatus: 'parcial',
        paidAmount: 200000
      },
      {
        id: 'appt-3',
        patientId: 'pat-3',
        doctorId: 'doc-3',
        procedureCode: 'BLANQ-01',
        date: today,
        time: '14:00',
        duration: 60,
        status: 'confirmada',
        paymentStatus: 'deuda',
        paidAmount: 0
      },
      {
        id: 'appt-4',
        patientId: 'pat-4',
        doctorId: 'doc-4',
        procedureCode: 'LIMP-01',
        date: today,
        time: '15:30',
        duration: 45,
        status: 'pendiente',
        paymentStatus: 'deuda',
        paidAmount: 0
      },
      {
        id: 'appt-5',
        patientId: 'pat-1',
        doctorId: 'doc-3',
        procedureCode: 'RES-01',
        date: tomorrow,
        time: '09:00',
        duration: 45,
        status: 'confirmada',
        paymentStatus: 'deuda',
        paidAmount: 0
      },
      {
        id: 'appt-6',
        patientId: 'pat-3',
        doctorId: 'doc-1',
        procedureCode: 'CONT-10',
        date: yesterday,
        time: '11:00',
        duration: 30,
        status: 'finalizada',
        paymentStatus: 'pagado',
        paidAmount: 90000
      }
    ]);
  }, []);

  // 5. Initial State: FINANCIALS
  const [financials, setFinancials] = useState<FinancialRecord[]>([
    { id: 'fin-1', patientId: 'pat-1', appointmentId: 'appt-1', date: '2026-05-21 09:10', amount: 90000, method: 'Transferencia', type: 'Ingreso', notes: 'Pago completo control de ortodoncia.' },
    { id: 'fin-2', patientId: 'pat-2', appointmentId: 'appt-2', date: '2026-05-21 09:55', amount: 200000, method: 'Efectivo', type: 'Ingreso', notes: 'Abono inicial de extracción molar. Saldo pendiente: 150000.' },
    { id: 'fin-3', patientId: 'pat-3', appointmentId: 'appt-6', date: '2026-05-20 11:35', amount: 90000, method: 'Nequi', type: 'Ingreso', notes: 'Pago control mensual.' }
  ]);

  // ACTIONS IMPLEMENTATION
  const addPatient = (newPat: Omit<Patient, 'id' | 'debt' | 'odontogram'>) => {
    const id = `pat-${patients.length + 1}`;
    const p: Patient = {
      ...newPat,
      id,
      debt: 0,
      odontogram: {}
    };
    setPatients(prev => [p, ...prev]);
    return p;
  };

  const updatePatient = (id: string, updatedFields: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    // Also cancel their pending appointments
    setAppointments(prev => prev.map(appt => appt.patientId === id ? { ...appt, status: 'cancelada' as const } : appt));
  };

  const updateOdontogram = (patientId: string, toothNumber: number, section: string, state: 'caries' | 'conducto' | 'corona' | 'none') => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const currentTooth = p.odontogram[toothNumber] || { vestibular: 'none', palatina: 'none', distal: 'none', mesial: 'none', oclusal: 'none' };
      const updatedTooth = { ...currentTooth, [section]: state };
      return {
        ...p,
        odontogram: {
          ...p.odontogram,
          [toothNumber]: updatedTooth
        }
      };
    }));
  };

  const addAppointment = (newAppt: Omit<Appointment, 'id' | 'paidAmount' | 'paymentStatus'>) => {
    const id = `appt-${appointments.length + 1}`;
    const procedure = procedures.find(pr => pr.code === newAppt.procedureCode);
    const finalPrice = procedure ? procedure.price : 0;
    
    const appt: Appointment = {
      ...newAppt,
      id,
      paymentStatus: 'deuda',
      paidAmount: 0
    };
    setAppointments(prev => [appt, ...prev]);

    // If patient had debt, update it
    setPatients(prev => prev.map(p => p.id === newAppt.patientId ? { ...p, debt: p.debt + finalPrice } : p));
  };

  const updateAppointment = (id: string, updatedFields: Partial<Appointment>) => {
    setAppointments(prev => prev.map(appt => {
      if (appt.id !== id) return appt;
      const finalAppt = { ...appt, ...updatedFields };

      // Handle debt calculations if payment details changed
      if (updatedFields.paidAmount !== undefined || updatedFields.procedureCode !== undefined) {
        const procedure = procedures.find(pr => pr.code === finalAppt.procedureCode);
        const fullPrice = procedure ? procedure.price : 0;
        const diffPaid = (updatedFields.paidAmount || 0) - appt.paidAmount;
        
        // Recalculate debt on patient
        setPatients(patPrev => patPrev.map(p => {
          if (p.id === appt.patientId) {
            let debtOffset = -diffPaid;
            if (updatedFields.procedureCode) {
              const oldProc = procedures.find(pr => pr.code === appt.procedureCode);
              const oldPrice = oldProc ? oldProc.price : 0;
              debtOffset += (fullPrice - oldPrice);
            }
            return { ...p, debt: Math.max(0, p.debt + debtOffset) };
          }
          return p;
        }));

        // Adjust paymentStatus
        if (finalAppt.paidAmount >= fullPrice) {
          finalAppt.paymentStatus = 'pagado';
        } else if (finalAppt.paidAmount > 0) {
          finalAppt.paymentStatus = 'parcial';
        } else {
          finalAppt.paymentStatus = 'deuda';
        }
      }

      return finalAppt;
    }));
  };

  const deleteAppointment = (id: string) => {
    // Soft cancel
    updateAppointment(id, { status: 'cancelada' });
  };

  const addFinancialRecord = (newRecord: Omit<FinancialRecord, 'id' | 'date'> & { date?: string }) => {
    const id = `fin-${financials.length + 1}`;
    
    // Format timestamp
    const now = new Date();
    const formattedDate = newRecord.date || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    const record: FinancialRecord = {
      ...newRecord,
      id,
      date: formattedDate
    };
    
    setFinancials(prev => [record, ...prev]);

    // Handle patient balance
    if (newRecord.type === 'Ingreso' && newRecord.patientId) {
      setPatients(prev => prev.map(p => {
        if (p.id === newRecord.patientId) {
          return { ...p, debt: Math.max(0, p.debt - newRecord.amount) };
        }
        return p;
      }));

      // Update appointment if linked
      if (newRecord.appointmentId) {
        setAppointments(prevAppt => prevAppt.map(appt => {
          if (appt.id === newRecord.appointmentId) {
            const newPaid = appt.paidAmount + newRecord.amount;
            const proc = procedures.find(pr => pr.code === appt.procedureCode);
            const price = proc ? proc.price : 0;
            const pStatus = newPaid >= price ? 'pagado' as const : (newPaid > 0 ? 'parcial' as const : 'deuda' as const);
            return {
              ...appt,
              paidAmount: newPaid,
              paymentStatus: pStatus
            };
          }
          return appt;
        }));
      }
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
      
      toasts,
      showToast,
      removeToast,
      
      addPatient,
      updatePatient,
      deletePatient,
      updateOdontogram,
      
      addAppointment,
      updateAppointment,
      deleteAppointment,
      
      addFinancialRecord,
      
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
