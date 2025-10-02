import { Container, Title, Text, Center } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';

export function MeditationPlaceholder() {
  return (
    <Container size="sm" py="xl">
      <Center>
        <div style={{ textAlign: 'center' }}>
          <IconBrain size={64} color="var(--mantine-color-aura-1)" />
          <Title order={2} mt="md" c="aura.1">Meditation Coming Soon</Title>
          <Text c="dimmed" mt="sm">
            Box breathing exercises to help you focus
          </Text>
        </div>
      </Center>
    </Container>
  );
}
