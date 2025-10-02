import { useState, useEffect, useRef } from 'react';
import { Container, Title, Text, Button, Group, Stack } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconRefresh } from '@tabler/icons-react';

export function BoxBreathingCanvas() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('inhale');
  const [timeLeft, setTimeLeft] = useState(4);
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0);

  const boxSize = 200;
  const centerX = 150;
  const centerY = 150;

  const getCircleRadius = () => {
    const baseRadius = 60;
    const maxRadius = 100;
    
    if (phase === 'inhale') {
      return baseRadius + (progress * (maxRadius - baseRadius));
    } else if (phase === 'exhale') {
      return maxRadius - (progress * (maxRadius - baseRadius));
    } else {
      return phase === 'hold1' ? maxRadius : baseRadius;
    }
  };

  const getCircleColor = () => {
    switch (phase) {
      case 'inhale':
        return { fill: 'rgba(34, 197, 94, 0.2)', stroke: 'rgba(34, 197, 94, 0.4)' }; // green
      case 'hold1':
      case 'hold2':
        return { fill: 'rgba(249, 115, 22, 0.2)', stroke: 'rgba(249, 115, 22, 0.4)' }; // orange
      case 'exhale':
        return { fill: 'rgba(239, 68, 68, 0.2)', stroke: 'rgba(239, 68, 68, 0.4)' }; // red
      default:
        return { fill: 'rgba(99, 102, 241, 0.1)', stroke: 'rgba(99, 102, 241, 0.3)' };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw breathing circle behind the box
    const circleRadius = getCircleRadius();
    const circleColor = getCircleColor();
    ctx.fillStyle = circleColor.fill;
    ctx.strokeStyle = circleColor.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    if (!isActive && progress === 0) {
      // Draw starting point
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX - boxSize/2, centerY + boxSize/2, 3, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const halfBox = boxSize / 2;
    const startX = centerX - halfBox;
    const startY = centerY + halfBox;
    const endX = centerX + halfBox;
    const endY = centerY - halfBox;

    ctx.beginPath();

    if (phase === 'inhale') {
      // Draw left side (bottom to top)
      const height = progress * boxSize;
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, startY - height);
    } else if (phase === 'hold1') {
      // Draw left side + top side
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, endY);
      const width = progress * boxSize;
      ctx.lineTo(startX + width, endY);
    } else if (phase === 'exhale') {
      // Draw left + top + right side
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, endY);
      ctx.lineTo(endX, endY);
      const height = progress * boxSize;
      ctx.lineTo(endX, endY + height);
    } else if (phase === 'hold2') {
      // Draw complete box
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, endY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(endX, startY);
      const width = progress * boxSize;
      ctx.lineTo(endX - width, startY);
    }

    ctx.stroke();
  }, [phase, progress, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const startTime = Date.now();
    const duration = 4000; // 4 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      
      setProgress(newProgress);
      setTimeLeft(Math.ceil(4 - (newProgress * 4)));

      if (newProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Move to next phase
        setPhase(currentPhase => {
          switch (currentPhase) {
            case 'inhale': return 'hold1';
            case 'hold1': return 'exhale';
            case 'exhale': return 'hold2';
            case 'hold2':
              setCycle(c => c + 1);
              return 'inhale';
            default: return 'inhale';
          }
        });
        setProgress(0);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, phase]);

  const toggleBreathing = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setTimeLeft(4);
    setCycle(0);
    setProgress(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold1': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'hold2': return 'Hold';
      default: return 'Ready';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return 'blue';
      case 'hold1': return 'yellow';
      case 'exhale': return 'green';
      case 'hold2': return 'orange';
      default: return 'gray';
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

        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            style={{
              borderRadius: '8px',
              background: 'transparent'
            }}
          />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <Title order={3} style={{ 
              color: '#fff', 
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' 
            }}>
              {getPhaseText()}
            </Title>
            <Text size="4rem" fw={700} style={{ 
              color: '#fff', 
              fontSize: '4rem',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              {timeLeft}
            </Text>
          </div>
        </div>

        <Text size="sm" c="dimmed">
          Cycle: {cycle}
        </Text>

        <Group>
          <Button
            onClick={toggleBreathing}
            leftSection={isActive ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
          >
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={handleReset}
          >
            Reset
          </Button>
        </Group>

        <Text size="sm" c="dark" ta="center" maw={400} fw={500}>
          Follow the box as it draws. Breathe in as the left side rises, hold during the top, 
          breathe out as the right side descends, and hold during the bottom.
        </Text>
      </Stack>
    </Container>
  );
}