// Test Payable authentication directly
const businessKey = '9A182A64D0AE4FFB';
const businessToken = '609E056B5E9EF21F32F8904C86C5F29D';

const basicAuth = Buffer.from(`${businessKey}:${businessToken}`).toString('base64');
console.log('Basic Auth Token:', basicAuth);

const testAuth = async () => {
  const endpoints = [
    'https://sandboxipgpayment.payable.lk/ipg/v2/auth/token',
    'https://sandboxipgpayment.payable.lk/ipg/v2/auth/tokenize',
    'https://sandboxipgpayment.payable.lk/auth/token',
    'https://sandboxipgpayment.payable.lk/auth/tokenize'
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTesting endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          grant_type: 'client_credentials'
        })
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Success! Response:', data);
        return;
      } else {
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.log('Fetch error:', error.message);
    }
  }
};

testAuth().catch(console.error);