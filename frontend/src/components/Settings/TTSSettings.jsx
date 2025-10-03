import { Select, Slider, Stack, Text } from '@mantine/core';
import { useTTS } from '../../contexts/TTSContext';
import { useEffect } from 'react';

export const TTSSettings = () => {
  const { voices, isSupported, preferences, updatePreferences } = useTTS();

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

  const voiceOptions = voices
    .filter(voice => {
      const isEnglishUS = voice.lang?.startsWith('en-US') || voice.locale?.startsWith('en_US');
      const isFemale = voice.name?.toLowerCase().includes('female') || 
                      ['Samantha', 'Alice', 'Allison', 'Ava', 'Susan', 'Victoria', 'Aria', 'Jenny'].includes(voice.name) ||
                      voice.gender?.toLowerCase() === 'female';
      
      console.log('🎤 Voice filter:', { name: voice.name, isEnglishUS, isFemale, gender: voice.gender });
      return isEnglishUS && isFemale;
    })
    .map(voice => ({
      value: voice.name,
      label: `${voice.name} (${voice.lang || voice.locale})`
    }));

  console.log('🎤 Available female voices:', voiceOptions);

  // Set default to AriaNeural (edge-tts) or Samantha (macOS) if available
  const defaultVoice = voiceOptions.find(v => v.value === 'en-US-AriaNeural')?.value || 
                      voiceOptions.find(v => v.value === 'Samantha')?.value || 
                      voiceOptions[0]?.value || 'en-US-AriaNeural';

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">Aurora's Voice Settings</Text>
      
      <Select
        label="Voice"
        data={voiceOptions}
        value={preferences?.tts_voice || defaultVoice}
        onChange={(value) => updatePreferences({ tts_voice: value })}
      />

      <div>
        <Text size="sm" mb="xs">Speech Rate: {preferences?.tts_rate || 1.0}</Text>
        <Slider
          min={0.5}
          max={2.0}
          step={0.1}
          value={preferences?.tts_rate || 1.0}
          onChange={(value) => updatePreferences({ tts_rate: value })}
        />
      </div>

      <div>
        <Text size="sm" mb="xs">Speech Pitch: {preferences?.tts_pitch || 1.0}</Text>
        <Slider
          min={0.5}
          max={2.0}
          step={0.1}
          value={preferences?.tts_pitch || 1.0}
          onChange={(value) => updatePreferences({ tts_pitch: value })}
        />
      </div>
    </Stack>
  );
};