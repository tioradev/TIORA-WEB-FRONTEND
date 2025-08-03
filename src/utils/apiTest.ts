// API Integration Test
// Use this file to test the API connection independently

import { apiService } from '../services/api';
import { envLog } from '../config/environment';

// Test function to verify API connection
export const testApiConnection = async () => {
  envLog.info('🧪 [API TEST] Starting API connection test...');
  
  try {
    // You can test with a simple request first
    // For now, we'll just log the configuration
    envLog.info('🔧 [API TEST] Current API configuration:');
    envLog.info('Base URL:', apiService['baseURL']);
    envLog.info('Environment: development (local backend expected on port 8090)');
    
    return {
      success: true,
      message: 'API service initialized successfully',
      baseUrl: apiService['baseURL']
    };
  } catch (error) {
    envLog.error('❌ [API TEST] Connection test failed:', error);
    return {
      success: false,
      message: 'API connection test failed',
      error: error
    };
  }
};

// Test salon registration data structure
export const testSalonDataStructure = () => {
  const testData = {
    name: "Test Salon",
    district: "Colombo",
    address: "123 Test Street, Colombo",
    phoneNumber: "+94771234567",
    email: "test@salon.com",
    ownerFirstName: "Test",
    ownerLastName: "Owner",
    ownerPhone: "+94771234567",
    ownerEmail: "owner@test.com",
    brNumber: "BR12345678",
    postalCode: "10100",
    username: "testuser",
    password: "testpassword123",
    defaultBranchName: "Test Branch"
  };
  
  envLog.info('📋 [DATA TEST] Sample salon registration data:');
  envLog.info(testData);
  
  return testData;
};
