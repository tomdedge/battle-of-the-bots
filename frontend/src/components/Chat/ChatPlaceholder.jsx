import { Container, Title, Text, Center } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';

export function ChatPlaceholder() {
  return (
    <Container size="sm" py="xl">
      <Center>
        <div style={{ textAlign: 'center' }}>
          <IconMessageCircle size={64} color="var(--mantine-color-aura-1)" />
          <Title order={2} mt="md" c="aura.1">Chat Coming Soon</Title>
          <Text c="dimmed" mt="sm">
            AI-powered conversation to help manage your calendar and tasks
          </Text>
        </div>
      </Center>
    </Container>
  );
}
