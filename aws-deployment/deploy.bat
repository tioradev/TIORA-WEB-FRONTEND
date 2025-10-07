@echo off
REM AWS Deployment Script for Tiora Frontend (Windows)
REM Usage: deploy.bat [environment]
REM Example: deploy.bat production

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

set DEPLOYMENT_DIR=%cd%
set PROJECT_ROOT=..\
set BUILD_DIR=dist

echo 🚀 Starting AWS deployment for Tiora Frontend...
echo Environment: %ENVIRONMENT%

REM Check if .env file exists
if not exist ".env" (
    echo ❌ Error: .env file not found!
    echo Please copy .env.example to .env and configure your settings.
    exit /b 1
)

echo 📦 Building frontend with environment: %ENVIRONMENT%

REM Clean previous builds
cd /d "%PROJECT_ROOT%"
if exist "%BUILD_DIR%" (
    rmdir /s /q "%BUILD_DIR%"
    echo 🧹 Cleaned previous build
)

REM Copy environment file to project root for build
copy "aws-deployment\.env" ".env" >nul

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Build the project
echo 🔨 Building project...
call npm run build

REM Check if build was successful
if not exist "%BUILD_DIR%" (
    echo ❌ Build failed - dist directory not found
    exit /b 1
)

echo ✅ Build completed successfully

REM Copy build files to deployment directory
cd /d "%DEPLOYMENT_DIR%"
if exist "dist" (
    rmdir /s /q "dist"
)

xcopy "..\%BUILD_DIR%" ".\dist\" /e /i >nul

echo 📋 Deployment Summary:
echo ├── Build files: .\dist\
echo ├── Nginx config: .\nginx.conf (template available)
echo ├── Environment: %ENVIRONMENT%
echo └── Ready for AWS deployment

echo.
echo 🎉 Deployment package ready!
echo.
echo Next steps for AWS deployment:
echo 1. Upload the 'dist' folder contents to your web server
echo 2. Configure Nginx using nginx.conf.template
echo 3. Ensure SSL certificates are in place
echo 4. Update DNS records to point to your server

REM Clean up
del "..\env" >nul 2>&1

pause