import { useState, useEffect } from 'react';
import { Stack, Title, Text, Button, RingProgress, Group, Modal } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconCheck } from '@tabler/icons-react';

export function SessionTimer({ duration = 25, title = "Focus Session", onComplete, onClose }) {
  const totalSeconds = duration * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isCompleted) {
      setIsCompleted(true);
      setIsActive(false);
      saveSession();
      if (onComplete) onComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isCompleted, onComplete]);

  const saveSession = () => {
    const session = {
      title,
      duration,
      completedAt: new Date().toISOString(),
      wasCompleted: timeLeft === 0
    };
    const sessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
    sessions.push(session);
    localStorage.setItem('focusSessions', JSON.stringify(sessions));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  const handleStart = () => setIsActive(true);
  const handlePause = () => setIsActive(false);
  const handleStop = () => {
    setIsActive(false);
    saveSession();
    if (onClose) onClose();
  };

  if (isCompleted) {
    return (
      <Modal opened={true} onClose={onClose} title="Session Complete!" centered>
        <Stack align="center" gap="lg">
          <IconCheck size={64} color="green" />
          <Title order={3} c="green">Well done!</Title>
          <Text ta="center" c="dimmed">
            You completed your {duration}-minute focus session. Take a moment to appreciate your accomplishment.
          </Text>
          <Button onClick={onClose} fullWidth>
            Continue
          </Button>
        </Stack>
      </Modal>
    );
  }

  return (
    <Modal opened={true} onClose={onClose} title={title} centered size="md">
      <Stack align="center" gap="xl">
        <RingProgress
          size={200}
          thickness={8}
          sections={[{ value: getProgress(), color: 'aura.1' }]}
          label={
            <Text size="xl" fw={700} ta="center">
              {formatTime(timeLeft)}
            </Text>
          }
        />
        
        <Group gap="md">
          {!isActive ? (
            <Button 
              leftSection={<IconPlayerPlay size={16} />}
              onClick={handleStart}
              size="lg"
            >
              {timeLeft === totalSeconds ? 'Start' : 'Resume'}
            </Button>
          ) : (
            <Button 
              leftSection={<IconPlayerPause size={16} />}
              onClick={handlePause}
              variant="outline"
              size="lg"
            >
              Pause
            </Button>
          )}
          
          <Button 
            leftSection={<IconPlayerStop size={16} />}
            onClick={handleStop}
            variant="light"
            color="gray"
            size="lg"
          >
            Stop
          </Button>
        </Group>

        <Text size="sm" c="dimmed" ta="center">
          {isActive ? 'Stay focused! You\'re doing great.' : 'Ready when you are.'}
        </Text>
      </Stack>
    </Modal>
  );
}
