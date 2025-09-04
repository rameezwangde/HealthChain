export type HealthRecord = {
  id: string;
  name: string;
  type: 'PDF' | 'Imaging' | 'Lab Report' | 'Prescription';
  date: string;
  size: string;
};

export type AccessLog = {
  id: string;
  user: string;
  userAvatar: string;
  role: 'Doctor' | 'Pharmacist' | 'Diagnostics' | 'Patient';
  action: string;
  timestamp: string;
};

export type ManagedUser = {
  id: string;
  name: string;
  avatar: string;
  role: 'Doctor' | 'Pharmacist' | 'Diagnostics';
  accessGranted: string;
};

export type Doctor = {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  location: string;
  availability: 'High' | 'Medium' | 'Low';
};

export type Medicine = {
  id: string;
  name: string;
  description: string;
};

export type Consultation = {
  id: string;
  doctor: string;
  date: string;
  notes: string;
  prescription?: string;
};

export type VitalHistory = {
    month: string;
    systolic: number;
    diastolic: number;
}

export const patientData = {
  name: "Jane Doe",
  avatar: "https://i.pravatar.cc/150?u=janedoe",
};

export const healthRecords: HealthRecord[] = [
  { id: 'rec1', name: 'Annual Checkup Results', type: 'PDF', date: '2023-10-15', size: '1.2 MB' },
  { id: 'rec2', name: 'Chest X-Ray', type: 'Imaging', date: '2023-09-20', size: '5.8 MB' },
  { id: 'rec3', name: 'Blood Test Analysis', type: 'Lab Report', date: '2023-10-14', size: '450 KB' },
  { id: 'rec4', name: 'Amoxicillin Prescription', type: 'Prescription', date: '2023-08-01', size: '80 KB' },
  { id: 'rec5', name: 'Dermatology Follow-up', type: 'PDF', date: '2023-07-22', size: '600 KB' },
];

export const accessLog: AccessLog[] = [
  { id: 'log1', user: 'Dr. John Smith', userAvatar: 'https://i.pravatar.cc/150?u=drsmith', role: 'Doctor', action: 'Viewed Chest X-Ray', timestamp: '2023-11-10 09:32 AM' },
  { id: 'log2', user: 'Central Pharmacy', userAvatar: 'https://i.pravatar.cc/150?u=pharmacy', role: 'Pharmacist', action: 'Viewed Amoxicillin Prescription', timestamp: '2023-11-09 04:15 PM' },
  { id: 'log3', user: 'Jane Doe', userAvatar: 'https://i.pravatar.cc/150?u=janedoe', role: 'Patient', action: 'Shared Annual Checkup Results', timestamp: '2023-11-09 11:05 AM' },
  { id: 'log4', user: 'City Diagnostics', userAvatar: 'https://i.pravatar.cc/150?u=diag', role: 'Diagnostics', action: 'Accessed Blood Test Analysis', timestamp: '2023-11-08 02:45 PM' },
];

export const managedUsers: ManagedUser[] = [
  { id: 'user1', name: 'Dr. John Smith', avatar: 'https://i.pravatar.cc/150?u=drsmith', role: 'Doctor', accessGranted: '2023-05-10' },
  { id: 'user2', name: 'Central Pharmacy', avatar: 'https://i.pravatar.cc/150?u=pharmacy', role: 'Pharmacist', accessGranted: '2023-08-01' },
  { id: 'user3', name: 'City Diagnostics', avatar: 'https://i.pravatar.cc/150?u=diag', role: 'Diagnostics', accessGranted: '2023-09-18' },
];

export const doctors: Doctor[] = [
  { id: 'doc1', name: 'Dr. Emily Carter', specialty: 'Cardiologist', location: 'Heartbeat Clinic, 123 Health St.', availability: 'Low', avatar: 'https://i.pravatar.cc/150?u=dremily' },
  { id: 'doc2', name: 'Dr. Ben Hanson', specialty: 'Dermatologist', location: 'SkinCare Center, 456 Wellness Ave.', availability: 'Medium', avatar: 'https://i.pravatar.cc/150?u=drben' },
  { id: 'doc3', name: 'Dr. Olivia Chen', specialty: 'Pediatrician', location: 'KidsHealth Group, 789 Child Way', availability: 'High', avatar: 'https://i.pravatar.cc/150?u=drolivia' },
];

export const medicines: Medicine[] = [
  { id: 'med1', name: 'Lisinopril', description: 'Used to treat high blood pressure. It can also be used to treat heart failure and improve survival after a heart attack.' },
  { id: 'med2', name: 'Metformin', description: 'Used with a proper diet and exercise program and possibly with other medications to control high blood sugar. It is used in patients with type 2 diabetes.' },
  { id: 'med3', name: 'Amoxicillin', description: 'A penicillin antibiotic that fights bacteria. Used to treat many different types of infection caused by bacteria, such as tonsillitis, bronchitis, pneumonia, and infections of the ear, nose, throat, skin, or urinary tract.' },
  { id: 'med4', name: 'Loratadine', description: 'An antihistamine that treats symptoms such as itching, runny nose, watery eyes, and sneezing from "hay fever" and other allergies.' },
  { id: 'med5', name: 'Hydrocortisone Cream', description: 'A topical corticosteroid used to treat a variety of skin conditions (e.g., insect bites, poison oak/ivy, eczema, dermatitis, allergies, rash, itching of the outer female genitals, anal itching).'},
];

export const consultations: Consultation[] = [
    { id: 'con1', doctor: 'Dr. John Smith', date: '2023-10-15', notes: 'Patient presented with seasonal allergy symptoms. Advised over-the-counter antihistamines and a follow-up if symptoms persist.', prescription: 'Loratadine 10mg' },
    { id: 'con2', doctor: 'Dr. Ben Hanson', date: '2023-07-22', notes: 'Follow-up on eczema treatment. The current cream is effective. Continue use and moisturize regularly. Next follow-up in 6 months.', prescription: 'Hydrocortisone Cream 1%' },
    { id: 'con3', doctor: 'Dr. John Smith', date: '2023-01-05', notes: 'Annual physical examination. All vitals are normal. Blood work ordered for routine check.', prescription: 'None' },
];

export const vitalHistory: VitalHistory[] = [
    { month: 'May', systolic: 120, diastolic: 80 },
    { month: 'Jun', systolic: 122, diastolic: 81 },
    { month: 'Jul', systolic: 125, diastolic: 82 },
    { month: 'Aug', systolic: 128, diastolic: 85 },
    { month: 'Sep', systolic: 126, diastolic: 84 },
    { month: 'Oct', systolic: 124, diastolic: 82 },
];
