import { Container, Title, Text, Center } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';

export function CalendarPlaceholder() {
  return (
    <Container size="sm" py="xl">
      <Center>
        <div style={{ textAlign: 'center' }}>
          <IconCalendar size={64} color="var(--mantine-color-aura-1)" />
          <Title order={2} mt="md" c="aura.1">Calendar Coming Soon</Title>
          <Text c="dimmed" mt="sm">
            Smart calendar with AI-suggested focus blocks
          </Text>
        </div>
      </Center>
    </Container>
  );
}
