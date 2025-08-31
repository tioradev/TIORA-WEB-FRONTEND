import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, User, Phone, 
  DollarSign, Star, Building, RotateCcw
} from 'lucide-react';
import { 
  apiService, 
  EmployeeUpdateRequest,
  EmployeeRegistrationRequest
} from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import AddEmployeeModal from './AddEmployeeModal';
import ConfirmationModal from '../shared/ConfirmationModal';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  email: string;
  phone: string;
  role: 'barber' | 'reception';
  branchId: string;
  specialties: string[];
  schedule: {
    [key: string]: { start: string; end: string; available: boolean };
  };
  monthlySalary: number;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  username: string;
  password: string;
  salonId: string;
  performanceRating?: number;
  profileImage?: string;
}


interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  email: string;
  phone: string;
  role: 'barber' | 'reception';
  branchId: string;
  specialties: string[];
  schedule: {
    [key: string]: { start: string; end: string; available: boolean };
  };
  monthlySalary: number;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  address: string;
  emergencyContact: { name: string; phone: string; relationship: string };
  username: string;
  password: string;
  salonId: string;
  performanceRating?: number;
  profileImage?: string;
  servesGender?: 'male' | 'female' | 'both'; // Gender preference for barber services
}



// --- Self-contained Staff Management with floating Add Staff button ---
const StaffManagementFixed: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(undefined);

  // Dummy onSubmit handler (replace with your logic)
  const handleAddOrEditStaff = (staffData: any) => {
    // TODO: Add your staff creation logic here
    setModalOpen(false);
    setEditingStaff(undefined);
    // Optionally show a toast or reload staff list
  };

  return (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      {/* Floating Add Staff Button */}
      <button
        onClick={() => {
          setEditingStaff(undefined);
          setModalOpen(true);
        }}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 100,
          background: 'linear-gradient(90deg, #a78bfa, #6366f1)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
          cursor: 'pointer',
          fontSize: 24
        }}
        title="Add Staff"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modal for Add/Edit Staff */}
      {modalOpen && (
        <AddEmployeeModal
          onClose={() => setModalOpen(false)}
          onAdd={handleAddOrEditStaff}
          salonId={1} // TODO: Replace with actual salonId from context or state
          branchId={1} // TODO: Replace with actual branchId from context or state
        />
      )}
    </div>
  );
};

export default StaffManagementFixed;
