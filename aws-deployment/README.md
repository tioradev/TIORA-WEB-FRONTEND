# Tiora Frontend - AWS Deployment Guide

This folder contains everything needed to deploy the Tiora frontend to AWS with configurable URLs.

## 🚀 Quick Start

1. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your domain and settings
   ```

2. **Deploy (Linux/Mac)**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh production
   ```

3. **Deploy (Windows)**
   ```cmd
   deploy.bat production
   ```

## 📁 File Structure

```
aws-deployment/
├── .env.example          # Environment configuration template
├── deploy.sh             # Linux/Mac deployment script
├── deploy.bat            # Windows deployment script
├── nginx.conf.template   # Nginx configuration template
├── docker-compose.yml    # Docker deployment option
├── README.md            # This file
└── dist/                # Generated build files (after deployment)
```

## ⚙️ Configuration

### Environment Variables (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://yourdomain.com/api/v1` |
| `VITE_WS_BASE_URL` | WebSocket URL | `wss://yourdomain.com` |
| `VITE_ENVIRONMENT` | Environment mode | `production` |
| `NGINX_SERVER_NAME` | Domain name | `yourdomain.com` |
| `NGINX_SSL_CERT_PATH` | SSL certificate path | `/etc/ssl/certs/cert.crt` |
| `NGINX_SSL_KEY_PATH` | SSL key path | `/etc/ssl/private/key.key` |

### Firebase Configuration

The following Firebase settings are pre-configured for the Tiora project:
- Project ID: `tiora-firebase`
- Storage Bucket: `tiora-firebase.appspot.com`
- Auth Domain: `tiora-firebase.firebaseapp.com`

## 🌐 Deployment Options

### Option 1: Static File Hosting (S3 + CloudFront)

1. Build the project:
   ```bash
   ./deploy.sh production
   ```

2. Upload `dist/` contents to S3 bucket

3. Configure CloudFront distribution

4. Set up API Gateway for backend routing

### Option 2: EC2 with Nginx

1. Launch EC2 instance (Ubuntu 20.04+ recommended)

2. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

3. Deploy files:
   ```bash
   # Run deployment script
   ./deploy.sh production
   
   # Copy files to server
   scp -r dist/ user@your-server:/var/www/html/tiora/
   scp nginx.conf user@your-server:/etc/nginx/sites-available/tiora
   ```

4. Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/tiora /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Option 3: Docker Container

1. Use the included Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Or build custom image:
   ```bash
   docker build -t tiora-frontend .
   docker run -p 80:80 -p 443:443 tiora-frontend
   ```

## 🔧 Backend Configuration

Ensure your backend is configured to handle CORS for your domain:

```java
@CrossOrigin(origins = {"https://yourdomain.com"})
```

## 🛡️ Security Considerations

1. **SSL/HTTPS**: Always use HTTPS in production
2. **CORS**: Configure backend CORS for your domain only
3. **Environment Variables**: Never commit actual .env files
4. **Firewall**: Restrict access to necessary ports only
5. **Updates**: Keep dependencies and server updated

## 📊 Monitoring & Logging

- Nginx access logs: `/var/log/nginx/access.log`
- Nginx error logs: `/var/log/nginx/error.log`
- Application logs: Browser developer console

## 🚨 Troubleshooting

### Common Issues

1. **API calls failing**
   - Check CORS configuration
   - Verify API URL in .env
   - Check network connectivity

2. **WebSocket connection issues**
   - Verify WS_BASE_URL setting
   - Check firewall rules
   - Ensure WebSocket support in proxy

3. **Build failures**
   - Run `npm install` first
   - Check Node.js version (16+ required)
   - Verify all environment variables are set

### Debug Commands

```bash
# Test API connectivity
curl -I https://yourdomain.com/api/v1/health

# Test WebSocket
wscat -c wss://yourdomain.com/ws/test

# Check Nginx configuration
sudo nginx -t

# View real-time logs
sudo tail -f /var/log/nginx/error.log
```

## 📞 Support

For deployment issues, check:
1. Environment configuration
2. Network connectivity
3. SSL certificate validity
4. Backend service status

---

**Note**: This deployment package includes all necessary configurations to run the Tiora frontend independently with any backend URL configuration.