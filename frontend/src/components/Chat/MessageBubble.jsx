import { Paper, Text, Box, Avatar, Group, Menu, ActionIcon } from '@mantine/core';
import { IconDots, IconTrash, IconRefresh, IconVolume, IconPlayerStop } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { useTTS } from '../../contexts/TTSContext';

export const MessageBubble = ({ message, isUser, timestamp, error, user, messageId, onDelete, onRegenerate }) => {
  const { speakText, stopSpeaking, isPlaying, isSupported, preferences } = useTTS();
  
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
        width: '100%'
      }}
    >
      <Box
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          flexDirection: isUser ? 'row-reverse' : 'row',
          maxWidth: '80%'
        }}
      >
        {isUser && (
          <Avatar 
            src={user?.picture}
            size="sm" 
            color="aura"
          >
            {getUserInitials(user?.name)}
          </Avatar>
        )}
        
        <Paper
          style={{
            minWidth: '80%',
            maxWidth: '80%',
            backgroundColor: isUser 
              ? 'var(--mantine-color-aura-1)' 
              : error 
                ? 'var(--mantine-color-red-1)'
                : 'var(--mantine-color-gray-1)',
            color: isUser ? 'white' : 'var(--mantine-color-text)',
            position: 'relative',
            padding: messageId && (onDelete || onRegenerate) ? '12px 32px 12px 12px' : !isUser && isSupported && preferences?.tts_enabled ? '12px 32px 12px 12px' : '12px',
            minWidth: '120px'
          }}
        >
          <ReactMarkdown>{message}</ReactMarkdown>
          {timestamp && (
            <Text size="xs" c={isUser ? "rgba(255,255,255,0.7)" : "dimmed"} mt={4}>
              {new Date(timestamp).toLocaleTimeString()}
            </Text>
          )}
          
          {!isUser && isSupported && preferences?.tts_enabled && (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="dark"
              onClick={() => isPlaying ? stopSpeaking() : speakText(message)}
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.1)'
              }}
              aria-label={isPlaying ? "Stop reading message" : "Read message aloud"}
            >
              {isPlaying ? <IconPlayerStop size={16} /> : <IconVolume size={16} />}
            </ActionIcon>
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
      </Box>
    </Box>
  );
};
