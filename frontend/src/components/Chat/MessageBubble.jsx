import { Paper, Text, Box, Avatar, Group } from '@mantine/core';

export const MessageBubble = ({ message, isUser, timestamp, error, user }) => {
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px'
      }}
    >
      <Group gap="xs" align="flex-start">
        {isUser && (
          <Avatar 
            src={user?.picture}
            size="sm" 
            color="aura"
            style={{ order: 2 }}
          >
            {getUserInitials(user?.name)}
          </Avatar>
        )}
        
        <Paper
          p="sm"
          style={{
            maxWidth: '80%',
            backgroundColor: isUser 
              ? 'var(--mantine-color-aura-1)' 
              : error 
                ? 'var(--mantine-color-red-1)'
                : 'var(--mantine-color-gray-1)',
            color: isUser ? 'white' : 'var(--mantine-color-text)',
            order: isUser ? 1 : 2
          }}
        >
          <Text size="sm">{message}</Text>
          {timestamp && (
            <Text size="xs" c="dimmed" mt={4}>
              {new Date(timestamp).toLocaleTimeString()}
            </Text>
          )}
        </Paper>
      </Group>
    </Box>
  );
};
