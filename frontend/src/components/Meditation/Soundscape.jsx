import { useState, useRef, useEffect } from 'react';
import { Container, Title, Button, Group, Stack, Image, ActionIcon } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconArrowLeft } from '@tabler/icons-react';

const soundscapes = [
  {
    id: 'forest',
    name: 'Forest',
    audio: '/sounds/forest.mp3',
    image: '/images/forest.jpg'
  },
  {
    id: 'cabin',
    name: 'Cabin',
    audio: '/sounds/cabin.mp3',
    image: '/images/cabin.jpg'
  },
  {
    id: 'beach',
    name: 'Beach',
    audio: '/sounds/beach.mp3',
    image: '/images/beach.jpg'
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    audio: '/sounds/whitenoise.mp3',
    image: '/images/whitenoise.jpg'
  }
];

export function Soundscape({ onBack }) {
  const [activeSoundscape, setActiveSoundscape] = useState('forest');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const currentSoundscape = soundscapes.find(s => s.id === activeSoundscape);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.7;
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentSoundscape.audio;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [activeSoundscape, currentSoundscape.audio]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const changeSoundscape = (soundscapeId) => {
    setActiveSoundscape(soundscapeId);
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <ActionIcon
            onClick={onBack}
            variant="subtle"
            size="lg"
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={2} c="aura.1">Soundscapes</Title>
          <div style={{ width: 40 }} />
        </Group>

        <div style={{ 
          position: 'relative', 
          borderRadius: '12px', 
          overflow: 'hidden',
          aspectRatio: '16/9',
          maxHeight: '400px'
        }}>
          <Image
            src={currentSoundscape.image}
            alt={currentSoundscape.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }}
            fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%23f1f3f4'/%3E%3Ctext x='200' y='112.5' text-anchor='middle' dy='.3em' fill='%23666'%3E{currentSoundscape.name}%3C/text%3E%3C/svg%3E"
          />
          
          <Button
            onClick={togglePlayPause}
            size="xl"
            leftSection={isPlaying ? <IconPlayerPause size={24} /> : <IconPlayerPlay size={24} />}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>

        <Group justify="center" gap="sm">
          {soundscapes.map((soundscape) => (
            <Button
              key={soundscape.id}
              onClick={() => changeSoundscape(soundscape.id)}
              variant={activeSoundscape === soundscape.id ? 'filled' : 'outline'}
              size="sm"
            >
              {soundscape.name}
            </Button>
          ))}
        </Group>

        <audio ref={audioRef} />
      </Stack>
    </Container>
  );
}