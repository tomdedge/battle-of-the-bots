import { Group, ActionIcon, Title, Drawer, Stack, Button, Text } from '@mantine/core';
import { IconSun, IconMoon, IconMenu2, IconLogout } from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [opened, { open, close }] = useDisclosure(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    close();
  };

  return (
    <>
      <Group justify="space-between" h="100%" px="md">
        <Group>
          <ActionIcon
            variant="outline"
            color="aura.1"
            onClick={open}
            size="lg"
          >
            <IconMenu2 size={18} />
          </ActionIcon>
          <Title order={3} c="aura.1">AuraFlow</Title>
        </Group>
        
        <ActionIcon
          variant="outline"
          color="aura.1"
          onClick={() => toggleColorScheme()}
          size="lg"
        >
          {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </ActionIcon>
      </Group>

      <Drawer opened={opened} onClose={close} title="Menu" position="left">
        <Stack gap="md">
          <Text size="sm" fw={500}>
            Signed in as {user?.name}
          </Text>
          <Button
            leftSection={<IconLogout size={16} />}
            variant="filled"
            color="red"
            onClick={handleLogout}
            fullWidth
            size="md"
          >
            Sign Out
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}
