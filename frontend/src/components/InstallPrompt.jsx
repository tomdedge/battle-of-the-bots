import { Button, Paper, Text, Group, rem } from '@mantine/core';
import { IconDownload, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { usePWA } from '../hooks/usePWA';

export const InstallPrompt = () => {
  const { isInstallable, installApp, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development');

  // Always show in development for testing
  if (process.env.NODE_ENV === 'development' && !dismissed) {
    // Show component for debugging
  } else {
    // Production logic
    if (isInstalled) return null;
    if (!isInstallable && !showManual && dismissed) return null;
    if (!isInstallable && !showManual) {
      setTimeout(() => setShowManual(true), 5000);
      return null;
    }
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
            {isInstallable ? 'Install AuraFlow' : showDebug ? 'PWA Debug Mode' : 'Add to Home Screen'}
          </Text>
          <Text size="xs" c="dimmed">
            {showDebug 
              ? `Installable: ${isInstallable}, Installed: ${isInstalled}`
              : isInstallable 
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