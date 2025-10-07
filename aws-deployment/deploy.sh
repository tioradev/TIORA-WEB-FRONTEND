#!/bin/bash

# AWS Deployment Script for Tiora Frontend
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
DEPLOYMENT_DIR="$(pwd)"
PROJECT_ROOT="../"
BUILD_DIR="dist"

echo "🚀 Starting AWS deployment for Tiora Frontend..."
echo "Environment: $ENVIRONMENT"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your settings."
    exit 1
fi

# Source environment variables
source .env

# Validate required variables
if [ -z "$VITE_API_BASE_URL" ] || [ -z "$VITE_WS_BASE_URL" ]; then
    echo "❌ Error: Required environment variables not set!"
    echo "Please check your .env file configuration."
    exit 1
fi

echo "📦 Building frontend with environment: $ENVIRONMENT"

# Clean previous builds
cd "$PROJECT_ROOT"
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    echo "🧹 Cleaned previous build"
fi

# Copy environment file to project root for build
cp "aws-deployment/.env" ".env"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Copy build files to deployment directory
cd "$DEPLOYMENT_DIR"
if [ -d "dist" ]; then
    rm -rf "dist"
fi

cp -r "../$BUILD_DIR" "./dist"

# Generate nginx configuration
echo "🔧 Generating Nginx configuration..."
envsubst '${NGINX_SERVER_NAME} ${NGINX_SSL_CERT_PATH} ${NGINX_SSL_KEY_PATH}' < nginx.conf.template > nginx.conf

echo "📋 Deployment Summary:"
echo "├── Build files: ./dist/"
echo "├── Nginx config: ./nginx.conf" 
echo "├── Environment: $ENVIRONMENT"
echo "├── API URL: $VITE_API_BASE_URL"
echo "└── WebSocket URL: $VITE_WS_BASE_URL"

echo ""
echo "🎉 Deployment package ready!"
echo ""
echo "Next steps for AWS deployment:"
echo "1. Upload the 'dist' folder contents to your web server"
echo "2. Configure Nginx using the generated nginx.conf"
echo "3. Ensure SSL certificates are in place"
echo "4. Update DNS records to point to your server"
echo ""
echo "For EC2 deployment, run:"
echo "  scp -r dist/ user@your-server:/var/www/html/"
echo "  scp nginx.conf user@your-server:/etc/nginx/sites-available/tiora"
echo ""

# Clean up
rm "../.env"