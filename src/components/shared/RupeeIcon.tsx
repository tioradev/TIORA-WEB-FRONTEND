import React from 'react';
import SriLankanRupeeIconSVG from '../../assets/images/Srilankan Rupee icon.svg';

interface RupeeIconProps {
  className?: string;
}

const RupeeIcon: React.FC<RupeeIconProps> = ({ className = "w-4 h-4" }) => {
  return (
    <img 
      src={SriLankanRupeeIconSVG} 
      alt="Sri Lankan Rupee" 
      className={className}
    />
  );
};

export default RupeeIcon;
