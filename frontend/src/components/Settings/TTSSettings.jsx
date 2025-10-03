import { Switch, Select, Slider, Stack, Text } from '@mantine/core';
import { useTTS } from '../../contexts/TTSContext';

export const TTSSettings = () => {
  const { voices, isSupported, preferences, updatePreferences } = useTTS();

  if (!isSupported) {
    return (
      <Text c="dimmed" size="sm">
        Text-to-speech is not supported in this browser
      </Text>
    );
  }

  const voiceOptions = voices
    .filter(voice => 
      voice.lang.startsWith('en-US') && 
      (voice.name.toLowerCase().includes('female') || 
       voice.name === 'Samantha' || 
       voice.name === 'Alice' || 
       voice.name === 'Allison' ||
       voice.name === 'Ava' ||
       voice.name === 'Susan')
    )
    .map(voice => ({
      value: voice.name,
      label: `${voice.name} (${voice.lang})`
    }));

  // Set default to Samantha if available
  const defaultVoice = voiceOptions.find(v => v.value === 'Samantha')?.value || voiceOptions[0]?.value || 'default';

  return (
    <Stack gap="md">
      <Switch
        label="Enable text-to-speech"
        checked={preferences?.tts_enabled || false}
        onChange={(event) => updatePreferences({ tts_enabled: event.currentTarget.checked })}
      />

      {preferences?.tts_enabled && (
        <>
          <Select
            label="TTS Provider"
            data={[
              { value: 'web', label: 'Browser (Web Speech API)' },
              { value: 'server', label: 'Server (Enhanced Quality)' }
            ]}
            value={preferences?.tts_provider || 'web'}
            onChange={(value) => updatePreferences({ tts_provider: value })}
          />

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
        </>
      )}
    </Stack>
  );
};