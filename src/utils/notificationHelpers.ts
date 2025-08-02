import { useNotifications } from '../contexts/NotificationContext';

// Notification templates for different roles and actions
export const notificationTemplates = {
  // Owner notifications
  owner: {
    lowInventory: {
      type: 'warning' as const,
      title: 'Low Inventory Alert',
      message: (item: string, count: number) => `${item} stock is running low. Only ${count} remaining.`
    },
    revenueTarget: {
      type: 'success' as const,
      title: 'Revenue Update',
      message: (percentage: number) => `Great job! You've achieved ${percentage}% of your monthly revenue target.`
    },
    staffRequest: {
      type: 'info' as const,
      title: 'Staff Request',
      message: (staff: string, request: string) => `${staff} has submitted a ${request} request.`
    },
    newCustomer: {
      type: 'success' as const,
      title: 'New Customer',
      message: (name: string) => `Welcome ${name}! New customer registered successfully.`
    },
    paymentIssue: {
      type: 'error' as const,
      title: 'Payment Issue',
      message: (customer: string) => `Payment processing failed for ${customer}. Please review.`
    }
  },
  
  // Super Admin notifications
  superAdmin: {
    systemUpdate: {
      type: 'info' as const,
      title: 'System Update',
      message: (version: string) => `System has been updated to version ${version}.`
    },
    newSalonRegistration: {
      type: 'success' as const,
      title: 'New Salon Registration',
      message: (salonName: string) => `${salonName} has registered and is pending approval.`
    },
    securityAlert: {
      type: 'warning' as const,
      title: 'Security Alert',
      message: (details: string) => `Security issue detected: ${details}`
    },
    maintenanceReminder: {
      type: 'info' as const,
      title: 'Maintenance Scheduled',
      message: (time: string) => `System maintenance scheduled for ${time}.`
    },
    subscriptionExpiry: {
      type: 'warning' as const,
      title: 'Subscription Expiring',
      message: (salonName: string, days: number) => `${salonName}'s subscription expires in ${days} days.`
    }
  },
  
  // Reception notifications (existing)
  reception: {
    appointmentConfirmed: {
      type: 'success' as const,
      title: 'Appointment Confirmed',
      message: (customer: string, time: string) => `${customer}'s appointment confirmed for ${time}.`
    },
    walkInCustomer: {
      type: 'info' as const,
      title: 'Walk-in Customer',
      message: (customer: string) => `${customer} is waiting for service.`
    },
    paymentReceived: {
      type: 'success' as const,
      title: 'Payment Received',
      message: (amount: number, customer: string) => `Payment of $${amount} received from ${customer}.`
    },
    sessionCompleted: {
      type: 'success' as const,
      title: 'Session Completed',
      message: (customer: string, time: string) => `${customer}'s session completed at ${time}. Ready for payment.`
    }
  }
};

// Utility functions to trigger notifications
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  const triggerOwnerNotification = (type: keyof typeof notificationTemplates.owner, ...args: any[]) => {
    const template = notificationTemplates.owner[type];
    addNotification({
      type: template.type,
      title: template.title,
      message: typeof template.message === 'function' ? (template.message as any)(...args) : template.message as string
    });
  };

  const triggerSuperAdminNotification = (type: keyof typeof notificationTemplates.superAdmin, ...args: any[]) => {
    const template = notificationTemplates.superAdmin[type];
    addNotification({
      type: template.type,
      title: template.title,
      message: typeof template.message === 'function' ? (template.message as any)(...args) : template.message as string
    });
  };

  const triggerReceptionNotification = (type: keyof typeof notificationTemplates.reception, ...args: any[]) => {
    const template = notificationTemplates.reception[type];
    addNotification({
      type: template.type,
      title: template.title,
      message: typeof template.message === 'function' ? (template.message as any)(...args) : template.message as string
    });
  };

  return {
    triggerOwnerNotification,
    triggerSuperAdminNotification,
    triggerReceptionNotification
  };
};
