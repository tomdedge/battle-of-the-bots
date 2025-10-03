import { useState, useEffect, useRef } from 'react';
import { Stack, ScrollArea, Text, Loader, Center, Box } from '@mantine/core';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import { useTTS } from '../../contexts/TTSContext';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import ApiService from '../../services/api';

export const ChatInterface = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const { speakText, preferences } = useTTS();
  const { 
    isConnected, 
    sendMessage, 
    onAIResponse, 
    messages,
    setMessages,
    regenerateResponse,
    user,
    ttsPreferences
  } = useSocket();
  const scrollAreaRef = useRef();

  useEffect(() => {
    const cleanup = onAIResponse((response) => {
      setIsLoading(false);
      
      // Add AI response to messages
      if (response?.message) {
        const aiMessage = {
          id: Date.now(),
          content: response.message,
          sender: 'aurora',
          timestamp: response.timestamp || new Date().toISOString(),
          toolResults: response.toolResults
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      
      // Auto-play Aurora's response if enabled
      if (preferences?.tts_autoplay && response?.message) {
        setTimeout(() => speakText(response.message), 500); // Small delay to ensure UI updates
      }
    });

    return cleanup;
  }, [onAIResponse, preferences?.tts_autoplay, speakText, setMessages]);

  useEffect(() => {
    // Auto-scroll to bottom when chat history updates
    if (scrollAreaRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({ 
            top: scrollAreaRef.current.scrollHeight, 
            behavior: 'smooth' 
          });
        }
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = (message) => {
    sendMessage(message);
    setIsLoading(true);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const api = new ApiService(token);
      await api.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleRegenerateResponse = async (messageId) => {
    // Find the user message for this messageId
    const userMessage = messages.find(m => m.id === messageId && m.sender === 'user');
    if (userMessage && userMessage.content) {
      setIsLoading(true);
      
      // Mark message as pending
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, pending: true }
          : m
      ));
      
      // Send the original message to get a new response
      regenerateResponse(userMessage.content);
    }
  };

  // Check if latest message is from AI for regeneration
  const latestMessage = messages[messages.length - 1];
  const canRegenerate = latestMessage && latestMessage.sender === 'aurora';

  return (
    <Stack 
      h="100%" 
      gap={0} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-body)',
        overflow: 'hidden',
      }}
    >
      <ScrollArea 
        h={0}
        style={{ flex: 1 }} 
        pt="md"
        ref={scrollAreaRef}
        viewportProps={{
          style: { backgroundColor: 'var(--mantine-color-body)' }
        }}
      >
        {messages.length === 0 ? (
          <Center h="100%" p="xs">
            <Stack align="center" gap="xs">
              <Text c="dimmed">Welcome to AuraFlow, {user?.name}!</Text>
              <Text size="sm" c="dimmed">Start a conversation about your productivity and mindfulness</Text>
            </Stack>
          </Center>
        ) : (
          messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              id={message.id}
              message={message.content}
              isUser={message.sender === 'user'}
              timestamp={message.timestamp}
              pending={message.pending}
              user={user} 
              onDelete={message.sender === 'user' ? handleDeleteMessage : null}
              onRegenerate={message.sender === 'aurora' ? handleRegenerateResponse : null}
            />
          ))
        )}
        {isLoading && (
          <Center mt="md">
            <Loader size="sm" />
          </Center>
        )}
      </ScrollArea>
      
      <Box 
        p="md" 
        style={{ 
          flexShrink: 0,
          backgroundColor: 'var(--mantine-color-body)',
          borderTop: '1px solid var(--mantine-color-gray-3)'
        }}
      >
        {!isConnected && (
          <Text size="xs" c="red" mb="xs">Connecting...</Text>
        )}
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={!isConnected || isLoading}
        />
      </Box>
    </Stack>
  );
};
