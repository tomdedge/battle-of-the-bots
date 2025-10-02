import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const webkitStandalone = window.navigator.standalone === true;
      return standalone || webkitStandalone;
    };
    
    setIsInstalled(checkInstalled());

    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('App installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Add listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Debug: Check if PWA criteria are met
    setTimeout(() => {
      const installed = checkInstalled();
      console.log('PWA Debug:', {
        hasServiceWorker: 'serviceWorker' in navigator,
        isSecure: location.protocol === 'https:' || location.hostname === 'localhost',
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        isInstalled: installed,
        userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
      });
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
    
    return outcome === 'accepted';
  };

  return {
    isInstallable,
    isInstalled,
    installApp
  };
};