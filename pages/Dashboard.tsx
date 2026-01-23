import React, { useState, useEffect } from 'react';
import DesktopDashboard from '../components/DesktopDashboard';
import MobilePWA from '../components/MobilePWA';

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen">
      {isMobile ? <MobilePWA /> : <DesktopDashboard />}
    </div>
  );
};

export default Dashboard;