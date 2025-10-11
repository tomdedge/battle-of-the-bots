import {
  Group,
  ActionIcon,
  Title,
  Drawer,
  Stack,
  Button,
  Text,
  Modal,
  Divider,
  Avatar,
} from "@mantine/core";
import {
  IconSun,
  IconMoon,
  IconMenu2,
  IconLogout,
  IconTrash,
} from "@tabler/icons-react";
import { useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { TTSSettings } from "../Settings/TTSSettings";
import ApiService from "../../services/api";

export function Header({ onTitleClick, activeTab }) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [opened, { open, close }] = useDisclosure(false);
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] =
    useDisclosure(false);
  const { user, logout, token } = useAuth();
  const { clearChatHistory } = useSocket();

  const handleLogout = () => {
    logout();
    close();
  };

  const handleClearChat = async () => {
    try {
      // Use socket for real-time clearing
      clearChatHistory();
      closeConfirm();
      close();
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  return (
    <>
      <Group justify="space-between" h="100%" px="md">
        <Group
          onClick={activeTab === "chate" ? undefined : () => onTitleClick()}
          style={{ cursor: activeTab === "chat" ? "default" : "pointer" }}
        >
          <img
            src="/icon.jpg"
            alt="AuraFlow"
            style={{ width: 43, aspectRatio: 1, borderRadius: "50%" }}
          />
          <Title
            order={3}
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              color: "var(--aura-primary)",
            }}
          >
            AuraFlow
          </Title>
        </Group>

        <Group>
          <ActionIcon
            variant="outline"
            color="aura.1"
            onClick={() => toggleColorScheme()}
            size="lg"
          >
            {colorScheme === "dark" ? (
              <IconSun size={18} />
            ) : (
              <IconMoon size={18} />
            )}
          </ActionIcon>
          <ActionIcon variant="outline" color="aura.1" onClick={open} size="lg">
            <IconMenu2 size={18} />
          </ActionIcon>
        </Group>
      </Group>

      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Text fw={700} size="lg" style={{ color: "var(--aura-primary)" }}>
            Menu
          </Text>
        }
        position="right"
      >
        <Stack gap="md">
          <Group gap="sm">
            <Avatar src={user?.picture} size="sm" color="aura">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "U"}
            </Avatar>
            <Text size="sm" fw={500}>
              Signed in as {user?.name}
            </Text>
          </Group>

          <Divider label="Text-to-Speech" labelPosition="center" />
          <TTSSettings />

          <Divider />

          <Button
            leftSection={<IconTrash size={16} />}
            variant="default"
            onClick={openConfirm}
            fullWidth
            size="md"
            color="red"
          >
            Clear Chat History
          </Button>

          <Button
            leftSection={<IconLogout size={16} />}
            variant="default"
            onClick={handleLogout}
            fullWidth
            size="md"
            style={{
              borderColor: "#dc2626",
              color: "#dc2626",
            }}
            styles={{
              root: {
                "&:hover": {
                  backgroundColor: "#dc2626",
                  color: "white",
                },
              },
            }}
          >
            Sign Out
          </Button>
        </Stack>
      </Drawer>

      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Clear Chat History"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to clear all chat history? This action cannot
            be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              color="red"
              variant="filled"
              onClick={handleClearChat}
              style={{ backgroundColor: "#dc2626", color: "white" }}
            >
              Clear All
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
