import { Paper, Text, Box, Avatar, Group, Menu, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { useState, useEffect } from 'react';
import { IconDots, IconTrash, IconRefresh, IconVolume, IconPlayerStop } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { useTTS } from '../../contexts/TTSContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';

export const MessageBubble = ({ message, isUser, timestamp, error, user, messageId, onDelete, onRegenerate }) => {
  const { speakText, stopSpeaking, isPlaying, isSupported, preferences } = useTTS();
  const { colorScheme } = useMantineColorScheme();
  const { token } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState(null);
  
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  useEffect(() => {
    if (user?.id && isUser && token) {
      console.log('Attempting to load avatar for user:', user.id);
      
      // Always fetch fresh from backend (it has its own caching)
      const api = new ApiService(token);
      api.getUserAvatar(user.id)
        .then(blob => {
          console.log('Avatar fetched successfully, blob size:', blob.size);
          const url = URL.createObjectURL(blob);
          setAvatarSrc(url);
          
          // Clean up previous blob URL to prevent memory leaks
          return () => URL.revokeObjectURL(url);
        })
        .catch(error => {
          console.error('Avatar fetch failed:', error);
          setAvatarSrc(null); // Fall back to initials
        });
    } else {
      console.log('Avatar loading skipped:', { 
        hasId: !!user?.id, 
        isUser, 
        hasToken: !!token
      });
    }
  }, [user?.id, isUser, token]);

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
        width: '100%'
      }}
      px="md"
    >
      <Box
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          flexDirection: isUser ? 'row-reverse' : 'row',
          width: '100%',
        }}
      >
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {isUser && (
            <Avatar 
              src={avatarSrc}
              size="md" 
              color="aura"
              style={{ border: '2px solid #1D9BBB' }}
            >
              {getUserInitials(user?.name)}
            </Avatar>
          )}
          
          {!isUser && (
            <>
              <Avatar 
                src="/aurora.jpg"
                size="md" 
                color="aura"
                style={{ border: '2px solid #DA7576', boxSizing: 'content-box' }}
              >
                A
              </Avatar>
              {isSupported && preferences?.tts_enabled && (
                <ActionIcon
                  size="sm"
                  variant="filled"
                  color="aura"
                  radius="xl"
                  onClick={() => {
                    if (isPlaying) {
                      stopSpeaking();
                    } else {
                      stopSpeaking(); // Stop any current playback first
                      setTimeout(() => speakText(message), 100); // Small delay to ensure stop completes
                    }
                  }}
                  style={{
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  aria-label={isPlaying ? "Stop reading message" : "Read message aloud"}
                >
                  {isPlaying ? <IconPlayerStop size={16} /> : <IconVolume size={16} />}
                </ActionIcon>
              )}
            </>
          )}
        </Box>
        
        <Paper
          style={{
            flex: 1,
            background: isUser 
              ? 'linear-gradient(135deg, #0A8FA8 0%, #1D9BBB 40%, #4DB8D1 60%, #1D9BBB 100%)' 
              : error 
                ? 'var(--mantine-color-red-1)'
                : colorScheme === 'dark' 
                  ? 'linear-gradient(135deg, #854B58 0%, #DA7576 40%, #E89899 60%, #DA7576 100%)'
                  : 'linear-gradient(135deg, #DA7576 0%, #E89899 40%, #F2B5B6 60%, #E89899 100%)',
            color: isUser ? 'white' : 'white',
            position: 'relative',
            padding: '8px 12px',
            boxShadow: isUser 
              ? 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.1)'
              : 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <ReactMarkdown 
            components={{
              p: ({ children }) => <p style={{ margin: 0, marginBottom: '4px' }}>{children}</p>,
              a: ({ children, href }) => (
                <a 
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: isUser ? '#ffffff' : '#ffffff',
                    textDecoration: 'underline',
                    textDecorationColor: isUser ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.7)',
                    fontWeight: 500
                  }}
                >
                  {children}
                </a>
              )
            }}
          >
            {message}
          </ReactMarkdown>
          {timestamp && (
            <Text size="xs" c={isUser ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.7)"} mt={8}>
              {new Date(timestamp).toLocaleTimeString()}
            </Text>
          )}
          
          {messageId && (onDelete || onRegenerate) && (
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color={isUser ? "white" : "white"}
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)'
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
