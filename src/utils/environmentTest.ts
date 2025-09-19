/**
 * Environment Variable Test
 * Run this to verify your environment variables are loaded correctly
 */

import { ENV_CONFIG, getCurrentConfig } from '../config/environment';

export function testEnvironmentVariables() {
  console.log('🔍 [ENV TEST] Environment Variable Configuration');
  console.log('===============================================');
  
  // Show current environment
  console.log('📌 Current Environment:', ENV_CONFIG.CURRENT_ENV);
  
  // Show all environment variables
  console.log('\n📋 Raw Environment Variables:');
  console.log('VITE_ENVIRONMENT:', import.meta.env.VITE_ENVIRONMENT);
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('VITE_WS_BASE_URL:', import.meta.env.VITE_WS_BASE_URL);
  
  // Show resolved configuration
  const currentConfig = getCurrentConfig();
  console.log('\n⚙️ Resolved Configuration:');
  console.log('API_BASE_URL:', currentConfig.API_BASE_URL);
  console.log('WS_BASE_URL:', currentConfig.WS_BASE_URL);
  console.log('API_TIMEOUT:', currentConfig.API_TIMEOUT);
  console.log('ENABLE_LOGGING:', currentConfig.ENABLE_LOGGING);
  
  // WebSocket URL resolution test
  const wsUrl = import.meta.env.VITE_WS_BASE_URL || currentConfig.WS_BASE_URL;
  console.log('\n🔌 WebSocket URL Resolution:');
  console.log('Final WebSocket URL:', wsUrl);
  
  // Test webhook URL formation
  const webhookUrl = `${currentConfig.API_BASE_URL.replace('/api/v1', '')}/api/payments/webhook`;
  console.log('\n🔗 Webhook URL Formation:');
  console.log('Expected Webhook URL:', webhookUrl);
  
  // Validation checks for production
  console.log('\n✅ Production Configuration Validation:');
  
  const checks = [
    {
      name: 'Environment is production',
      pass: ENV_CONFIG.CURRENT_ENV === 'production',
      expected: 'production',
      actual: ENV_CONFIG.CURRENT_ENV
    },
    {
      name: 'API URL points to salon.run.place',
      pass: currentConfig.API_BASE_URL.includes('salon.run.place'),
      expected: 'https://salon.run.place/api/v1',
      actual: currentConfig.API_BASE_URL
    },
    {
      name: 'WebSocket URL uses secure connection',
      pass: wsUrl.startsWith('wss://'),
      expected: 'wss://salon.run.place/ws',
      actual: wsUrl
    },
    {
      name: 'Webhook URL is correctly formed',
      pass: webhookUrl === 'https://salon.run.place/api/payments/webhook',
      expected: 'https://salon.run.place/api/payments/webhook',
      actual: webhookUrl
    }
  ];
  
  checks.forEach(check => {
    if (check.pass) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      console.log(`   Expected: ${check.expected}`);
      console.log(`   Actual: ${check.actual}`);
    }
  });
  
  const allPassed = checks.every(check => check.pass);
  
  if (allPassed) {
    console.log('\n🎉 All configuration checks passed!');
    console.log('🚀 Ready for production deployment');
  } else {
    console.log('\n⚠️  Some configuration checks failed');
    console.log('📝 Please review the failed checks above');
  }
  console.log('\n🔌 WebSocket URL Resolution:');
  console.log('Priority 1 (VITE_WS_BASE_URL):', import.meta.env.VITE_WS_BASE_URL);
  console.log('Priority 2 (Config fallback):', currentConfig.WS_BASE_URL);
  console.log('Final WebSocket URL:', wsUrl);
  
  // Validation
  console.log('\n✅ Validation:');
  const isProduction = ENV_CONFIG.CURRENT_ENV === 'production';
  const hasCorrectProtocol = wsUrl.startsWith(isProduction ? 'wss://' : 'ws://');
  const hasCorrectDomain = wsUrl.includes('salon.run.place');
  
  console.log('Is Production Environment:', isProduction);
  console.log('Has Correct Protocol (wss for prod):', hasCorrectProtocol);
  console.log('Has Correct Domain:', hasCorrectDomain);
  console.log('Environment Valid:', isProduction && hasCorrectProtocol && hasCorrectDomain);
  
  return {
    environment: ENV_CONFIG.CURRENT_ENV,
    wsUrl,
    apiUrl: currentConfig.API_BASE_URL,
    isValid: isProduction && hasCorrectProtocol && hasCorrectDomain
  };
}

// Export for use in components
export default testEnvironmentVariables;