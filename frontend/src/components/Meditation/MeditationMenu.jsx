import { useState } from "react";
import {
  Title,
  Text,
  Button,
  Stack,
  Group,
  useMantineColorScheme,
} from "@mantine/core";
import { IconLungs, IconVolume } from "@tabler/icons-react";
import { BoxBreathingCanvas } from "./BoxBreathingCanvas";
import { Soundscape } from "./Soundscape";

export function MeditationMenu() {
  const [activeMode, setActiveMode] = useState(null);
  const { colorScheme } = useMantineColorScheme();

  if (activeMode === "breathing") {
    return <BoxBreathingCanvas onBack={() => setActiveMode(null)} />;
  }

  if (activeMode === "soundscape") {
    return <Soundscape onBack={() => setActiveMode(null)} />;
  }

  return (
    <div
      style={{
        backgroundColor:
          colorScheme === "dark"
            ? "var(--mantine-color-dark-7)"
            : "var(--mantine-color-body)",
        minHeight: "100vh",
        width: "100%",
        padding: "40px 20px",
      }}
    >
      <Stack align="center" gap="xl">
        <div style={{ textAlign: "center" }}>
          <Title order={2} c="aura.1">
            Meditation
          </Title>
          <Text c="dimmed" mt="sm">
            Choose your meditation practice
          </Text>
        </div>

        <Group gap="lg" justify="start" align="start">
          <Button
            size="lg"
            leftSection={<IconLungs size={24} />}
            onClick={() => setActiveMode("breathing")}
            variant="outline"
            justify="start"
            align="center"
            style={{ minWidth: 200, height: 80, flex: 1 }}
            styles={{ inner: { gap: "20px" } }}
          >
            <Stack gap={4} align="start">
              <Text fw={600}>Box Breathing</Text>
              <Text size="sm" c="dimmed">
                4-4-4-4 breathing pattern
              </Text>
            </Stack>
          </Button>

          <Button
            size="lg"
            leftSection={<IconVolume size={24} />}
            onClick={() => setActiveMode("soundscape")}
            variant="outline"
            justify="start"
            align="center"
            style={{ minWidth: 200, height: 80, flex: 1 }}
            styles={{ inner: { gap: "20px" } }}
          >
            <Stack gap={4} align="start">
              <Text fw={600}>Soundscapes</Text>
              <Text size="sm" c="dimmed">
                Ambient nature sounds
              </Text>
            </Stack>
          </Button>
        </Group>
      </Stack>
    </div>
  );
}
