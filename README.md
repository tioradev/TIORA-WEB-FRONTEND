# TIORA Salon Management System - Frontend

## Deployment Instructions for Vercel

### Prerequisites
- Vercel account
- Git repository connected to Vercel

### Environment Variables
Set these environment variables in your Vercel deployment:

```bash
VITE_API_BASE_URL=http://54.169.11.244/api/v1
VITE_ENVIRONMENT=production
```

### Deployment Steps

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - In project settings, add the environment variables listed above

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### Backend Configuration
- Backend API: `http://54.169.11.244/api/v1`
- Swagger UI: `http://54.169.11.244/swagger-ui/index.html`

### Features
- Reception Dashboard with appointment management
- Owner Dashboard with analytics and business management  
- Employee management system
- Real-time search functionality
- Responsive design with Tailwind CSS

### Tech Stack
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons
- Firebase for additional services

### CORS Configuration
The application includes proper CORS headers in `vercel.json` for seamless integration with the AWS backend.

### Post-Deployment
After deployment, verify:
1. Application loads correctly
2. API calls to AWS backend work
3. Authentication flows properly
4. All dashboard features function as expected

### Development
For local development:
```bash
npm install
npm run dev
```

The app will run on `http://localhost:5173`
