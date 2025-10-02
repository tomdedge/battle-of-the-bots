import { Paper, Text, Box, Avatar, Group, Menu, ActionIcon } from '@mantine/core';
import { IconDots, IconTrash, IconRefresh } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';

export const MessageBubble = ({ message, isUser, timestamp, error, user, messageId, onDelete, onRegenerate }) => {
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '8px'
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
            order: isUser ? 1 : 2,
            position: 'relative',
            paddingRight: messageId && (onDelete || onRegenerate) ? '32px' : undefined
          }}
        >
          <ReactMarkdown>{message}</ReactMarkdown>
          {timestamp && (
            <Text size="xs" c={isUser ? "rgba(255,255,255,0.7)" : "dimmed"} mt={4}>
              {new Date(timestamp).toLocaleTimeString()}
            </Text>
          )}
          
          {messageId && (onDelete || onRegenerate) && (
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color={isUser ? "white" : "dark"}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }}
                >
                  <IconDots size={12} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {isUser && onDelete && (
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color="red"
                    onClick={() => onDelete(messageId)}
                  >
                    Delete message
                  </Menu.Item>
                )}
                {!isUser && onRegenerate && (
                  <Menu.Item
                    leftSection={<IconRefresh size={14} />}
                    onClick={() => onRegenerate(messageId)}
                  >
                    Regenerate response
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
        </Paper>
      </Group>
    </Box>
  );
};
