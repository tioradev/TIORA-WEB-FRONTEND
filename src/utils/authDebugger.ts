// Authentication debugging utility
import { apiService, getApiBaseUrl } from '../services/api';

export class AuthDebugger {
  static async testAuthentication(employeeId?: string): Promise<{
    success: boolean;
    issues: string[];
    tokenInfo: any;
    testResults: any;
  }> {
    const issues: string[] = [];
    const results: any = {
      success: false,
      issues,
      tokenInfo: {},
      testResults: {}
    };

    // 1. Check localStorage token
    const storedToken = localStorage.getItem('authToken');
    results.tokenInfo.hasStoredToken = !!storedToken;
    results.tokenInfo.storedTokenLength = storedToken ? storedToken.length : 0;
    
    if (!storedToken) {
      issues.push('No authentication token found in localStorage');
    }

    // 2. Check API service token
    const apiToken = apiService.getAuthToken();
    results.tokenInfo.hasApiToken = !!apiToken;
    results.tokenInfo.apiTokenLength = apiToken ? apiToken.length : 0;
    results.tokenInfo.tokensMatch = storedToken === apiToken;

    if (!apiToken) {
      issues.push('API service does not have authentication token');
    }

    if (storedToken && apiToken && storedToken !== apiToken) {
      issues.push('localStorage token differs from API service token');
    }

    // 3. Check token format (should be JWT)
    if (storedToken) {
      const tokenParts = storedToken.split('.');
      results.tokenInfo.tokenParts = tokenParts.length;
      results.tokenInfo.looksLikeJWT = tokenParts.length === 3;
      results.tokenInfo.preview = storedToken.substring(0, 50) + '...';

      if (tokenParts.length !== 3) {
        issues.push('Token does not appear to be a valid JWT format');
      }
    }

    // 4. Test authentication with a simple API call
    if (storedToken && employeeId) {
      try {
        const testResponse = await fetch(`${getApiBaseUrl()}/employees/${employeeId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });

        results.testResults.status = testResponse.status;
        results.testResults.ok = testResponse.ok;

        if (testResponse.status === 401) {
          issues.push('Token is invalid or expired (401 Unauthorized)');
        } else if (testResponse.status === 403) {
          issues.push('Token is valid but lacks required permissions (403 Forbidden)');
        } else if (!testResponse.ok) {
          issues.push(`API returned unexpected status: ${testResponse.status}`);
        } else {
          results.success = true;
        }

        // Try to get response body for more details
        try {
          const responseText = await testResponse.text();
          if (responseText) {
            results.testResults.responseBody = responseText.substring(0, 500);
          }
        } catch (e) {
          // Ignore response body parsing errors
        }

      } catch (error) {
        issues.push(`Network error during authentication test: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.testResults.networkError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return results;
  }

  static async refreshAndTest(employeeId?: string): Promise<any> {
    console.log('🔄 [AUTH-DEBUG] Refreshing authentication and testing...');
    
    // Refresh the API service token
    const refreshed = apiService.refreshAuthToken();
    console.log('🔄 [AUTH-DEBUG] Token refresh result:', refreshed);

    // Run full test
    const results = await this.testAuthentication(employeeId);
    console.log('🔍 [AUTH-DEBUG] Authentication test results:', results);

    return results;
  }

  static logDetailedStatus(): void {
    console.log('🔍 [AUTH-DEBUG] Detailed authentication status:');
    console.log('  API Service Status:', apiService.getTokenStatus());
    console.log('  localStorage token exists:', !!localStorage.getItem('authToken'));
    console.log('  API base URL:', getApiBaseUrl());
    
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      console.log('  Token preview:', storedToken.substring(0, 50) + '...');
      console.log('  Token length:', storedToken.length);
      console.log('  Token parts:', storedToken.split('.').length);
    }
  }
}
