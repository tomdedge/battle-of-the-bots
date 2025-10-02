import { Paper, Text, Badge, Group } from '@mantine/core';
import { usePWA } from '../hooks/usePWA';

export const PWAStatus = () => {
  const { isInstallable, isInstalled } = usePWA();
  
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <Paper p="xs" style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}>
      <Text size="xs" fw={600} mb={4}>PWA Status</Text>
      <Group gap="xs">
        <Badge color={isInstalled ? 'green' : 'gray'} size="xs">
          {isInstalled ? 'Installed' : 'Not Installed'}
        </Badge>
        <Badge color={isInstallable ? 'blue' : 'gray'} size="xs">
          {isInstallable ? 'Installable' : 'Not Installable'}
        </Badge>
        <Badge color={'serviceWorker' in navigator ? 'green' : 'red'} size="xs">
          SW: {'serviceWorker' in navigator ? 'OK' : 'No'}
        </Badge>
      </Group>
    </Paper>
  );
};