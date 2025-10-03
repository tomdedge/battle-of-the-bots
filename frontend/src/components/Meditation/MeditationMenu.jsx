import { useState } from 'react';
import { Container, Title, Text, Button, Stack, Group } from '@mantine/core';
import { IconLungs, IconVolume } from '@tabler/icons-react';
import { BoxBreathingCanvas } from './BoxBreathingCanvas';
import { Soundscape } from './Soundscape';

export function MeditationMenu() {
  const [activeMode, setActiveMode] = useState(null);

  if (activeMode === 'breathing') {
    return <BoxBreathingCanvas onBack={() => setActiveMode(null)} />;
  }

  if (activeMode === 'soundscape') {
    return <Soundscape onBack={() => setActiveMode(null)} />;
  }

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xl">
        <div style={{ textAlign: 'center' }}>
          <Title order={2} c="aura.1">Meditation</Title>
          <Text c="dimmed" mt="sm">
            Choose your meditation practice
          </Text>
        </div>

        <Group gap="lg">
          <Button
            size="lg"
            leftSection={<IconLungs size={24} />}
            onClick={() => setActiveMode('breathing')}
            variant="outline"
            style={{ minWidth: 200, height: 80 }}
          >
            <Stack gap={4} align="center">
              <Text fw={600}>Box Breathing</Text>
              <Text size="sm" c="dimmed">4-4-4-4 breathing pattern</Text>
            </Stack>
          </Button>

          <Button
            size="lg"
            leftSection={<IconVolume size={24} />}
            onClick={() => setActiveMode('soundscape')}
            variant="outline"
            style={{ minWidth: 200, height: 80 }}
          >
            <Stack gap={4} align="center">
              <Text fw={600}>Soundscapes</Text>
              <Text size="sm" c="dimmed">Ambient nature sounds</Text>
            </Stack>
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}