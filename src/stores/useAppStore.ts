import { create } from 'zustand';

interface User {
  username: string;
  isAuthenticated: boolean;
}

interface Student {
  id: number;
  name: string;
  regNo: string;
  class: string;
  phone: string;
  status: string;
  father: string;
  mother: string;
  aadhaar: string;
  address: string;
  dob?: string;
  gender?: string;
  marks: number;
  previousSchool: string;
  hostel: boolean;
  caste: string;
  income: number;
  avatar?: string;
}

interface Faculty {
  permanentAddress: string;
  permanentState: string;
  permanentDistrict: string;
  permanentCity: string;
  permanentPinCode: string;
  currentAddress: string;
  currentState: string;
  currentDistrict: string;
  currentCity: string;
  currentPinCode: string;
  aadhaar: string;
  employeeType: ReactNode;
  id: number;
  name: string;
  department: string;
  phone: string;
  experience: string;
  qualification?: string;
  email?: string;
  address?: string;
}

interface FeeRecord {
  studentId: number;
  studentName: string;
  regNo: string;
  totalFee: number;
  paid: number;
  balance: number;
  payments: Payment[];
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  transactionId: string;
  date: string;
  receiptNo: string;
}

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  students: Student[];
  faculty: Faculty[];
  feeRecords: FeeRecord[];
  
  login: (username: string, password: string) => boolean;
  logout: () => void;
  toggleTheme: () => void;
  
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: number, student: Partial<Student>) => void;
  deleteStudent: (id: number) => void;
  getStudent: (id: number) => Student | undefined;
  
  addFaculty: (faculty: Omit<Faculty, 'id'>) => void;
  updateFaculty: (id: number, faculty: Partial<Faculty>) => void;
  deleteFaculty: (id: number) => void;
  
  getFeeRecord: (studentId: number) => FeeRecord | undefined;
  addPayment: (studentId: number, payment: Omit<Payment, 'id' | 'receiptNo'>) => void;
}

const initialStudents: Student[] = [
  {
    id: 1,
    name: "Rahul Sharma",
    regNo: "STU2098",
    class: "10-A",
    phone: "9876543210",
    status: "Active",
    father: "Ram Sharma",
    mother: "Suman Sharma",
    aadhaar: "123412341234",
    address: "Bengaluru, Karnataka",
    dob: "2008-05-15",
    gender: "Male",
    marks: 455,
    previousSchool: "ABC High School",
    hostel: false,
    caste: "GM",
    income: 450000,
  },
  {
    id: 2,
    name: "Ananya R",
    regNo: "STU1785",
    class: "9-B",
    phone: "9102345432",
    status: "Active",
    father: "Ramesh R",
    mother: "Kavya R",
    aadhaar: "432143214321",
    address: "Mysore, Karnataka",
    dob: "2009-03-22",
    gender: "Female",
    marks: 478,
    previousSchool: "XYZ Higher Secondary",
    hostel: true,
    caste: "OBC",
    income: 300000,
  },
  {
    id: 3,
    name: "Priya Menon",
    regNo: "STU2341",
    class: "10-B",
    phone: "9988776655",
    status: "Active",
    father: "Suresh Menon",
    mother: "Lakshmi Menon",
    aadhaar: "567856785678",
    address: "Chennai, Tamil Nadu",
    dob: "2008-08-10",
    gender: "Female",
    marks: 492,
    previousSchool: "St. Mary's School",
    hostel: false,
    caste: "GM",
    income: 650000,
  },
];

const initialFaculty: Faculty[] = [
  {
    id: 1,
    name: "Dr. Suresh Kumar",
    department: "Mathematics",
    phone: "9876542201",
    experience: "5 years",
    qualification: "M.Sc., Ph.D.",
    email: "suresh.k@school.edu",
    address: "Bengaluru",
  },
  {
    id: 2,
    name: "Priya Menon",
    department: "Science",
    phone: "9001122334",
    experience: "3 years",
    qualification: "M.Sc.",
    email: "priya.m@school.edu",
    address: "Mysore",
  },
];

const initialFeeRecords: FeeRecord[] = [
  {
    studentId: 1,
    studentName: "Rahul Sharma",
    regNo: "STU2098",
    totalFee: 55000,
    paid: 35000,
    balance: 20000,
    payments: [
      {
        id: 1,
        amount: 35000,
        method: "UPI",
        transactionId: "UPI202401250001",
        date: "2024-01-25",
        receiptNo: "REC001",
      },
    ],
  },
  {
    studentId: 2,
    studentName: "Ananya R",
    regNo: "STU1785",
    totalFee: 55000,
    paid: 42500,
    balance: 12500,
    payments: [
      {
        id: 1,
        amount: 42500,
        method: "Cash",
        transactionId: "CASH20240115",
        date: "2024-01-15",
        receiptNo: "REC002",
      },
    ],
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  theme: 'light',
  students: initialStudents,
  faculty: initialFaculty,
  feeRecords: initialFeeRecords,

  login: (username, password) => {
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (trimmedUsername === 'admin' && trimmedPassword === 'admin123') {
      const user = { username, isAuthenticated: true };
      set({ user });
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    return false;
  },

  logout: () => {
    set({ user: null });
    localStorage.removeItem('user');
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    localStorage.setItem('theme', newTheme);
  },

  addStudent: (student) => {
    const students = get().students;
    const newStudent = {
      ...student,
      id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1,
    };
    const updatedStudents = [...students, newStudent];
    set({ students: updatedStudents });
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    
    // Initialize fee record
    const feeRecords = get().feeRecords;
    const updatedFeeRecords = [...feeRecords, {
      studentId: newStudent.id,
      studentName: newStudent.name,
      regNo: newStudent.regNo,
      totalFee: 55000,
      paid: 0,
      balance: 55000,
      payments: [],
    }];
    set({ feeRecords: updatedFeeRecords });
    localStorage.setItem('feeRecords', JSON.stringify(updatedFeeRecords));
  },

  updateStudent: (id, updates) => {
    const updatedStudents = get().students.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    set({ students: updatedStudents });
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  },

  deleteStudent: (id) => {
    const updatedStudents = get().students.filter((s) => s.id !== id);
    set({ students: updatedStudents });
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  },

  getStudent: (id) => {
    return get().students.find((s) => s.id === id);
  },

  addFaculty: (faculty) => {
    const faculties = get().faculty;
    const newFaculty = {
      ...faculty,
      id: faculties.length > 0 ? Math.max(...faculties.map(f => f.id)) + 1 : 1,
    };
    const updatedFaculty = [...faculties, newFaculty];
    set({ faculty: updatedFaculty });
    localStorage.setItem('faculty', JSON.stringify(updatedFaculty));
  },

  updateFaculty: (id, updates) => {
    const updatedFaculty = get().faculty.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    set({ faculty: updatedFaculty });
    localStorage.setItem('faculty', JSON.stringify(updatedFaculty));
  },

  deleteFaculty: (id) => {
    const updatedFaculty = get().faculty.filter((f) => f.id !== id);
    set({ faculty: updatedFaculty });
    localStorage.setItem('faculty', JSON.stringify(updatedFaculty));
  },

  getFeeRecord: (studentId) => {
    return get().feeRecords.find((f) => f.studentId === studentId);
  },

  addPayment: (studentId, payment) => {
    const feeRecords = get().feeRecords;
    const recordIndex = feeRecords.findIndex((f) => f.studentId === studentId);
    
    if (recordIndex !== -1) {
      const record = feeRecords[recordIndex];
      const newPayment = {
        ...payment,
        id: record.payments.length + 1,
        receiptNo: `REC${String(Date.now()).slice(-6)}`,
      };
      
      const updatedRecord = {
        ...record,
        paid: record.paid + payment.amount,
        balance: record.totalFee - (record.paid + payment.amount),
        payments: [...record.payments, newPayment],
      };
      
      const updatedRecords = [...feeRecords];
      updatedRecords[recordIndex] = updatedRecord;
      set({ feeRecords: updatedRecords });
      localStorage.setItem('feeRecords', JSON.stringify(updatedRecords));
    }
  },
}));

// Load from localStorage on init
const storedUser = localStorage.getItem('user');
const storedTheme = localStorage.getItem('theme');
const storedStudents = localStorage.getItem('students');
const storedFaculty = localStorage.getItem('faculty');
const storedFeeRecords = localStorage.getItem('feeRecords');

if (storedUser) {
  useAppStore.setState({ user: JSON.parse(storedUser) });
}
if (storedTheme) {
  useAppStore.setState({ theme: storedTheme as 'light' | 'dark' });
}
if (storedStudents) {
  useAppStore.setState({ students: JSON.parse(storedStudents) });
}
if (storedFaculty) {
  useAppStore.setState({ faculty: JSON.parse(storedFaculty) });
}
if (storedFeeRecords) {
  useAppStore.setState({ feeRecords: JSON.parse(storedFeeRecords) });
}
