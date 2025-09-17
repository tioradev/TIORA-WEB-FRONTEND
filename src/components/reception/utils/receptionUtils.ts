import { Appointment } from '../../../types';

// Utility functions for reception dashboard
export class ReceptionUtils {
  // Function to show success message
  static showSuccessMessage(
    message: string,
    setSuccessMessage: (state: { show: boolean; message: string }) => void
  ) {
    setSuccessMessage({ show: true, message });
    setTimeout(() => {
      setSuccessMessage({ show: false, message: '' });
    }, 3000); // Hide after 3 seconds
  }

  // Function to show error message
  static showErrorMessage(message: string) {
    console.error('❌ [ERROR]', message);
    alert(message); // Simple alert for now, can be replaced with better UI
  }

  // Search function for appointments
  static searchAppointments(appointments: Appointment[], searchTerm: string): Appointment[] {
    if (!searchTerm.trim()) return appointments;
    const searchLower = searchTerm.toLowerCase();
    return appointments.filter(app =>
      app.customerName.toLowerCase().includes(searchLower) ||
      app.customerPhone.toLowerCase().includes(searchLower)
    );
  }

  // Create user profile from employee data
  static createUserProfile(user: any, employee: any) {
    return {
      id: user?.id || '',
      name: employee?.fullName || user?.name || '',
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      email: employee?.email || user?.email || '',
      phone: employee?.phoneNumber || '',
      role: 'reception' as const,
      avatar: employee?.profileImageUrl || user?.profilePicture || '',
      // Employee specific fields
      employeeId: employee?.employeeId?.toString() || '',
      dateOfBirth: employee?.dateOfBirth || '',
      gender: employee?.gender || 'OTHER',
      address: employee?.address || '',
      city: employee?.city || '',
      hireDate: employee?.hireDate || '',
      emergencyContact: employee?.emergencyContact || '',
      emergencyPhone: employee?.emergencyPhone || '',
      emergencyRelationship: employee?.emergencyRelationship || '',
      specializations: employee?.specializations || [],
      experience: employee?.experience || '',
      experienceYears: employee?.experienceYears || 0,
      baseSalary: employee?.baseSalary || 0,
      ratings: employee?.ratings || 0,
      // Salon specific fields
      salonName: employee?.salonName || '',
      salonId: employee?.salonId?.toString() || '',
      branchId: employee?.branchId?.toString() || '',
      // Additional fields
      notes: employee?.notes || '',
      profileImageUrl: employee?.profileImageUrl || ''
    };
  }

  // Download report function
  static downloadReport(todayAppointments: Appointment[], totalStatistics: any) {
    // Create PDF report content
    const reportContent = `
DAILY RECEPTION REPORT
Date: ${new Date().toLocaleDateString()}

TODAY'S APPOINTMENTS: ${todayAppointments.length}

PAYMENT STATUS:
- Completed Payments: ${todayAppointments.filter(app => app.paymentStatus === 'completed' && app.date === new Date().toISOString().split('T')[0]).length}
- Pending Payments: ${totalStatistics.totalPendingPayments}
- Total Income from Completed Payments: Rs. ${totalStatistics.totalDailyIncome.toFixed(2)}

APPOINTMENT DETAILS:
${todayAppointments.map(app =>
      `- ${app.customerName} | ${app.serviceName} | ${app.timeSlot} | ${app.status} | Rs. ${app.finalAmount}`
    ).join('\n')}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    // Create a simple text-based PDF content
    const blob = new Blob([reportContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reception-report-${new Date().toISOString().split('T')[0]}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
