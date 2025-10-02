import { Button, Paper, Text, Group, rem } from '@mantine/core';
import { IconDownload, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { usePWA } from '../hooks/usePWA';

export const InstallPrompt = () => {
  const { isInstallable, installApp, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;
  
  // If not installable, show manual instructions after delay
  if (!isInstallable && !showManual) {
    setTimeout(() => setShowManual(true), 5000);
    return null;
  }

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setDismissed(true);
    }
  };

  return (
    <Paper
      p="md"
      shadow="md"
      style={{
        position: 'fixed',
        bottom: rem(80),
        left: rem(16),
        right: rem(16),
        zIndex: 1000,
        borderRadius: rem(12)
      }}
    >
      <Group justify="space-between" align="flex-start">
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={600} mb={4}>
            {isInstallable ? 'Install AuraFlow' : 'Add to Home Screen'}
          </Text>
          <Text size="xs" c="dimmed">
            {isInstallable 
              ? 'Add to your home screen for quick access'
              : 'Use browser menu → "Add to Home Screen"'
            }
          </Text>
        </div>
        <Group gap="xs">
          {isInstallable ? (
            <Button
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={handleInstall}
            >
              Install
            </Button>
          ) : (
            <Button
              size="xs"
              variant="outline"
              onClick={() => setDismissed(true)}
            >
              Got it
            </Button>
          )}
          <Button
            size="xs"
            variant="subtle"
            onClick={() => setDismissed(true)}
          >
            <IconX size={14} />
          </Button>
        </Group>
      </Group>
    </Paper>
  );
};