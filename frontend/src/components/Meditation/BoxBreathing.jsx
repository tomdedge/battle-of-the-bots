import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Group, Stack, ActionIcon } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconRefresh } from '@tabler/icons-react';

export function BoxBreathing() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('inhale'); // inhale, hold1, exhale, hold2
  const [timeLeft, setTimeLeft] = useState(4);
  const [cycle, setCycle] = useState(0);

  // Timer logic
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next phase
          setPhase(currentPhase => {
            switch (currentPhase) {
              case 'inhale':
                return 'hold1';
              case 'hold1':
                return 'exhale';
              case 'exhale':
                return 'hold2';
              case 'hold2':
                setCycle(c => c + 1);
                return 'inhale';
              default:
                return 'inhale';
            }
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  const toggleBreathing = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setTimeLeft(4);
    setCycle(0);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold1':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'hold2':
        return 'Hold';
      default:
        return 'Ready';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return 'blue';
      case 'hold1':
        return 'yellow';
      case 'exhale':
        return 'green';
      case 'hold2':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getCircleScale = () => {
    const progress = (4 - timeLeft) / 4;
    switch (phase) {
      case 'inhale':
        return 1 + (progress * 0.5); // Grow from 1 to 1.5
      case 'hold1':
        return 1.5; // Stay large
      case 'exhale':
        return 1.5 - (progress * 0.5); // Shrink from 1.5 to 1
      case 'hold2':
        return 1; // Stay small
      default:
        return 1;
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xl">
        <div style={{ textAlign: 'center' }}>
          <Title order={2} c="aura.1">Box Breathing</Title>
          <Text c="dimmed" mt="sm">
            4-4-4-4 breathing pattern for focus and calm
          </Text>
        </div>

        <ActionIcon
          size={200}
          radius="50%"
          variant="filled"
          color="aura"
          onClick={toggleBreathing}
          style={{
            transform: `scale(${getCircleScale()})`,
            transition: isActive ? 'transform 1s ease-in-out' : 'none',
            cursor: 'pointer',
            border: '3px solid var(--mantine-color-gray-3)',
            background: `var(--mantine-color-${getPhaseColor()}-5)`,
          }}
        >
          {isActive ? (
            <IconPlayerPause size={48} />
          ) : (
            <IconPlayerPlay size={48} />
          )}
        </ActionIcon>

        <Stack align="center" gap="sm">
          <Title order={3} c={getPhaseColor()}>
            {getPhaseText()}
          </Title>
          <Text size="xl" fw={700}>
            {timeLeft}
          </Text>
          <Text size="sm" c="dimmed">
            Cycle: {cycle}
          </Text>
        </Stack>

        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleReset}
            variant="outline"
            color="gray"
          >
            Reset
          </Button>
        </Group>

        <Text size="sm" c="dimmed" ta="center" maw={400}>
          Click the circle to start/stop. Follow as it expands and contracts. 
          Breathe in as it grows, hold when it's large, breathe out as it shrinks, and hold when it's small.
        </Text>
      </Stack>
    </Container>
  );
}
