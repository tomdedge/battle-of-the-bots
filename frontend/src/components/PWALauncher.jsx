import { Button, Text, Paper, Group } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';

export const PWALauncher = () => {
  const openPWA = () => {
    // Try to open the PWA
    window.open('/?source=pwa', '_blank');
  };

  const checkInstallation = () => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const fromPWA = new URLSearchParams(window.location.search).get('source') === 'pwa';
    
    console.log('PWA Status:', {
      isPWA,
      fromPWA,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    });
  };

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <Paper p="md" style={{ position: 'fixed', bottom: 150, right: 16, zIndex: 1000 }}>
      <Text size="sm" fw={600} mb="xs">PWA Test</Text>
      <Group gap="xs">
        <Button size="xs" onClick={openPWA} leftSection={<IconExternalLink size={14} />}>
          Launch PWA
        </Button>
        <Button size="xs" variant="outline" onClick={checkInstallation}>
          Check Status
        </Button>
      </Group>
    </Paper>
  );
};