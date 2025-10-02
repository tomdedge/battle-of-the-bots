import { Button, Paper, Text, Stack } from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

export const GoogleSignIn = () => {
  const { login } = useAuth();

  return (
    <Paper p="xl" radius="md" style={{ maxWidth: 400, margin: '0 auto' }}>
      <Stack align="center" gap="md">
        <Text size="lg" fw={500}>Welcome to AuraFlow</Text>
        <Text size="sm" c="dimmed" ta="center">
          Sign in with Google to access your calendar and tasks
        </Text>
        <Button
          leftSection={<IconBrandGoogle size={16} />}
          onClick={login}
          size="md"
          fullWidth
        >
          Sign in with Google
        </Button>
      </Stack>
    </Paper>
  );
};