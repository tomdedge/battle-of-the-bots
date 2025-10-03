import { useState, useEffect, useRef } from 'react';
import { Container, Title, Text, Stack, ScrollArea } from '@mantine/core';

export function BoxBreathingCanvas() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('inhale');
  const [timeLeft, setTimeLeft] = useState(4);
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
    <Stack h="100%" gap={0}>
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
              width={300}
              height={300}
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
                color: '#fff', 
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                marginBottom: '8px'
              }}>
                {getPhaseText()}
              </Title>
              <Text style={{ 
                color: '#fff', 
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