import { Group, ActionIcon, Title } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';

export function Header() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Group justify="space-between" h="100%" px="md">
      <Title order={3} c="aura.1">AuraFlow</Title>
      <ActionIcon
        variant="outline"
        color="aura.1"
        onClick={() => toggleColorScheme()}
        size="lg"
      >
        {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Group>
  );
}
