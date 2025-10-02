import { Paper, Text, Box } from '@mantine/core';

export const MessageBubble = ({ message, isUser, timestamp, error }) => {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px'
      }}
    >
      <Paper
        p="sm"
        style={{
          maxWidth: '80%',
          backgroundColor: isUser 
            ? 'var(--mantine-color-aura-1)' 
            : error 
              ? 'var(--mantine-color-red-1)'
              : 'var(--mantine-color-gray-1)',
          color: isUser ? 'white' : 'var(--mantine-color-text)'
        }}
      >
        <Text size="sm">{message}</Text>
        {timestamp && (
          <Text size="xs" c="dimmed" mt={4}>
            {new Date(timestamp).toLocaleTimeString()}
          </Text>
        )}
      </Paper>
    </Box>
  );
};
