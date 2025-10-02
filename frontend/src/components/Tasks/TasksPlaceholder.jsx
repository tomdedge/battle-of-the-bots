import { Container, Title, Text, Center } from '@mantine/core';
import { IconChecklist } from '@tabler/icons-react';

export function TasksPlaceholder() {
  return (
    <Container size="sm" py="xl">
      <Center>
        <div style={{ textAlign: 'center' }}>
          <IconChecklist size={64} color="var(--mantine-color-aura-1)" />
          <Title order={2} mt="md" c="aura.1">Tasks Coming Soon</Title>
          <Text c="dimmed" mt="sm">
            Integrated task management with Google Tasks
          </Text>
        </div>
      </Center>
    </Container>
  );
}
