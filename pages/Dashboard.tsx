import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DesktopDashboard from '../components/DesktopDashboard';
import MobilePWA from '../components/MobilePWA';

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile: render MobilePWA without Layout (fullscreen PWA experience)
  // Desktop: render DesktopDashboard inside Layout (with sidebar)
  if (isMobile) {
    return <MobilePWA />;
  }

  return (
    <Layout>
      <DesktopDashboard />
    </Layout>
  );
};

export default Dashboard;