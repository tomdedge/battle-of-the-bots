import { useState, useEffect, useRef } from 'react';
import { Container, Title, Text, Stack, ScrollArea, useMantineColorScheme } from '@mantine/core';

export function BoxBreathingCanvas() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('inhale');
  const [timeLeft, setTimeLeft] = useState(4);
  const [progress, setProgress] = useState(0);
  const { colorScheme } = useMantineColorScheme();

  const boxSize = 240;
  const centerX = 175;
  const centerY = 175;

  const getCircleRadius = () => {
    const baseRadius = 80;
    const maxRadius = 110;
    
    if (phase === 'inhale') {
      return baseRadius + (progress * (maxRadius - baseRadius));
    } else if (phase === 'exhale') {
      return maxRadius - (progress * (maxRadius - baseRadius));
    } else {
      return phase === 'hold1' ? maxRadius : baseRadius;
    }
  };

  const getCircleColor = () => {
    const isDark = colorScheme === 'dark';
    
    switch (phase) {
      case 'inhale':
        return { 
          fill: isDark ? 'rgba(74, 222, 128, 0.3)' : 'rgba(34, 197, 94, 0.2)', 
          stroke: isDark ? 'rgba(74, 222, 128, 0.6)' : 'rgba(34, 197, 94, 0.4)' 
        };
      case 'hold1':
      case 'hold2':
        return { 
          fill: isDark ? 'rgba(251, 146, 60, 0.3)' : 'rgba(249, 115, 22, 0.2)', 
          stroke: isDark ? 'rgba(251, 146, 60, 0.6)' : 'rgba(249, 115, 22, 0.4)' 
        };
      case 'exhale':
        return { 
          fill: isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(239, 68, 68, 0.2)', 
          stroke: isDark ? 'rgba(248, 113, 113, 0.6)' : 'rgba(239, 68, 68, 0.4)' 
        };
      default:
        return { 
          fill: isDark ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.1)', 
          stroke: isDark ? 'rgba(129, 140, 248, 0.4)' : 'rgba(99, 102, 241, 0.3)' 
        };
    }
  };

  const getBoxStrokeColor = () => {
    return colorScheme === 'dark' ? '#8b5cf6' : '#6366f1';
  };

  const getTextColor = () => {
    return colorScheme === 'dark' ? '#f1f5f9' : '#fff';
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
      ctx.strokeStyle = getBoxStrokeColor();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX - boxSize/2, centerY + boxSize/2, 3, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    ctx.strokeStyle = getBoxStrokeColor();
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
  }, [phase, progress, isActive, colorScheme]);

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
            case 'hold2': return 'inhale';
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

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold1': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'hold2': return 'Hold';
      default: return 'Ready';
    }
  };

  return (
    <Stack 
      h="100%" 
      gap={0}
      style={{ 
        backgroundColor: 'var(--mantine-color-body)',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ 
          flex: 1, 
          height: '100%', 
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={toggleBreathing}
      >
        <Stack align="center" justify="center" gap="xl" style={{ height: '100%' }}>
          <div 
            style={{ 
              position: 'relative',
              cursor: 'pointer',
              width: '100%',
              maxWidth: '600px',
            }}
          >
            <canvas
              ref={canvasRef}
              width={350}
              height={350}
              style={{
                borderRadius: '50%',
                background: 'transparent',
                width: '100%',
                height: '100%'
              }}
            />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <Title order={3} style={{ 
                color: getTextColor(), 
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                marginBottom: '8px'
              }}>
                {getPhaseText()}
              </Title>
              <Text style={{ 
                color: getTextColor(), 
                fontSize: '4rem',
                fontWeight: 700,
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                lineHeight: 1
              }}>
                {timeLeft}
              </Text>
            </div>
          </div>

          <Text size="sm" c="dimmed" ta="center" maw={400}>
            {isActive ? 'Tap to pause' : 'Tap the circle to start breathing'}
          </Text>
        </Stack>
      </div>
    </Stack>
  );
}