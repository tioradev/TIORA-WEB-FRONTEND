import React from 'react';
// Import the logo image
import TioraLogo from '../../assets/images/Tiora black png.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  variant?: 'icon' | 'full' | 'text';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'icon',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24',
    '3xl': 'w-32 h-32'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
    '3xl': 'text-5xl'
  };

  // Logo Icon Component - Using your actual logo
  const LogoIcon = () => (
    <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`}>
      <img 
        src={TioraLogo} 
        alt="Tiora Manager Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );

  // Logo Text Component
  const LogoText = () => (
    <div className={className}>
      <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent`}>
        Tiora Manager
      </span>
      <p className="text-gray-600 text-xs font-medium mt-1">Professional Salon & Skin Care Management System</p>
    </div>
  );

  if (variant === 'icon') {
    return <LogoIcon />;
  }

  if (variant === 'text') {
    return <LogoText />;
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <LogoIcon />
        <LogoText />
      </div>
    );
  }

  return <LogoIcon />;
};

export default Logo;
