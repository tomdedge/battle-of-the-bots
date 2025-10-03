import { Switch, Text } from '@mantine/core';
import { useTTS } from '../../contexts/TTSContext';
import { useEffect } from 'react';

export const TTSSettings = () => {
  const { isSupported, preferences, updatePreferences } = useTTS();

  // Always enable TTS on mount
  useEffect(() => {
    if (!preferences?.tts_enabled) {
      updatePreferences({ tts_enabled: true });
    }
  }, [preferences?.tts_enabled, updatePreferences]);

  if (!isSupported) {
    return (
      <Text c="dimmed" size="sm">
        Text-to-speech is not supported in this browser
      </Text>
    );
  }

  return (
    <Switch
      label="Auto-play Aurora's messages"
      description="Automatically read Aurora's responses aloud"
      checked={preferences?.tts_autoplay || false}
      onChange={(event) => updatePreferences({ tts_autoplay: event.currentTarget.checked })}
    />
  );
};