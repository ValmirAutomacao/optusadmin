import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import WhatsappInstances from '../components/WhatsappInstances';

const Whatsapp: React.FC = () => {
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
    <Layout isMobile={isMobile}>
      <WhatsappInstances />
    </Layout>
  );
};

export default Whatsapp;