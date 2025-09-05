# API Integration Documentation

## Environment Configuration

The salon registration system is integrated with a backend API. You can easily switch between local development and production environments.

### Current Setup

# API Integration Documentation

## Environment Configuration

The salon management system is integrated with a backend API that handles both authentication and salon registration. You can easily switch between local development and production environments.

### Current Setup

**Local Development API:**
- Base URL: `http://localhost:8090/api/v1`
- Port: 8090
- Endpoints:
  - Authentication: `POST /auth/login`
  - Salon Registration: `POST /salons/comprehensive`

### Authentication Flow

**Login API:**
- Endpoint: `POST /api/v1/auth/login`
- Request Format:
```json
{
  "usernameOrEmail": "salonowner",
  "password": "owner123"
}
```

**Response Format:**
```json
{
  "token": "jwt-token-here",
  "role": "SALON_OWNER | SALON_RECEPTION | SUPER_ADMIN",
  "user": {
    "id": "user-id",
    "username": "salonowner",
    "email": "owner@salon.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Login successful"
}
```

**Role-Based Navigation:**
- `SALON_OWNER` → Owner Dashboard
- `SALON_RECEPTION` → Reception Dashboard  
- `SUPER_ADMIN` → Super Admin Dashboard

### Salon Registration API

**Updated Request Format:**
```json
{
  "name": "Final Test Salon",
  "description": "Testing with correct fields",
  "address": "789 Final St",
  "city": "Final City",
  "state": "Final State",
  "zipCode": "67890",
  "country": "Final Country",
  "phoneNumber": "5555555555",
  "email": "final@salon.com",
  "website": "https://finalsalon.com",
  "taxId": "FINAL789",
  "ownerFirstName": "Final",
  "ownerLastName": "Owner",
  "ownerPhone": "4444444444",
  "ownerEmail": "finalowner@salon.com",
  "username": "finalowner",
  "password": "password123",
  "defaultBranchName": "Final Branch",
  "branchEmail": "finalbranch@salon.com",
  "branchPhoneNumber": "3333333333",
  "latitude": "42.3601",
  "longitude": "-71.0589"
}
```

### Authentication Integration

**Token Management:**
- JWT tokens are automatically stored and included in API requests
- Token is cleared on logout
- Authorization header: `Bearer {token}`

**Error Handling:**
- **401 Unauthorized:** Invalid credentials
- **403 Forbidden:** Insufficient permissions
- **Network Error:** Server connection issues

To change between local and production environments, edit the file:
`src/config/environment.ts`

```typescript
export const ENV_CONFIG = {
  // Change this line to switch environments:
  CURRENT_ENV: 'development' as 'development' | 'production',
  
  development: {
    API_BASE_URL: 'http://localhost:8090/api/v1',
    API_TIMEOUT: 10000,
    ENABLE_LOGGING: true,
  },
  
  production: {
    API_BASE_URL: 'https://your-production-domain.com/api/v1', // Update this URL
    API_TIMEOUT: 30000,
    ENABLE_LOGGING: false,
  }
};
```

### For Production Deployment:

1. **Update Production URL:**
   - Edit `src/config/environment.ts`
   - Replace `https://your-production-domain.com/api/v1` with your actual production API URL

2. **Switch Environment:**
   - Change `CURRENT_ENV: 'development'` to `CURRENT_ENV: 'production'`

3. **Build for Production:**
   ```bash
   npm run build
   ```

### API Request Format

The salon registration sends the following data to `POST /api/v1/salons/comprehensive`:

```json
{
  "name": "Elite Hair Salon",
  "district": "Colombo",
  "address": "123 Main Street, Colombo",
  "phoneNumber": "+94771234567",
  "email": "elite@salon.com",
  "ownerFirstName": "John",
  "ownerLastName": "Doe",
  "ownerPhone": "+94771234567",
  "ownerEmail": "john@elite.com",
  "brNumber": "BR12345678",
  "postalCode": "10100",
  "username": "johndoe",
  "password": "password123",
  "defaultBranchName": "Main Branch"
}
```

### Error Handling

The system handles various API errors:
- **400 Bad Request:** Invalid salon data
- **409 Conflict:** Salon with email/username already exists
- **Network Error:** Server connection issues

### Development Features

When in development mode:
- Detailed console logging is enabled
- API requests and responses are logged
- Enhanced error messages for debugging

### Testing the Integration

1. **Start your backend server** on port 8090
2. **Start the frontend** with `npm run dev`
3. **Navigate to Super Admin Dashboard** → Salon Management
4. **Click "Add New Salon"** to test the registration
5. **Check browser console** for detailed API logs

### Quick Environment Switch Commands

```bash
# For development (local API)
# Edit src/config/environment.ts and set CURRENT_ENV: 'development'

# For production (remote API)  
# Edit src/config/environment.ts and set CURRENT_ENV: 'production'
# Update production URL in the same file
```
