import { useState, useEffect, useRef } from 'react';
import { Stack, ScrollArea, Text, Loader, Center, Box } from '@mantine/core';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import ApiService from '../../services/api';

export const ChatInterface = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const { 
    isConnected, 
    sendMessage, 
    onAIResponse, 
    chatHistory,
    setChatHistory,
    regenerateResponse,
    user,
    ttsPreferences
  } = useSocket();
  const scrollAreaRef = useRef();

  useEffect(() => {
    const cleanup = onAIResponse((response) => {
      setIsLoading(false);
    });

    return cleanup;
  }, [onAIResponse]);

  useEffect(() => {
    // Auto-scroll to bottom when chat history updates
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [chatHistory]);

  const handleSendMessage = (message) => {
    sendMessage(message);
    setIsLoading(true);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const api = new ApiService(token);
      await api.deleteChatMessage(messageId);
      setChatHistory(prev => prev.filter(chat => chat.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleRegenerateResponse = async (messageId) => {
    // Find the chat entry for this message
    const chat = chatHistory.find(c => c.id === messageId);
    if (chat && chat.message) {
      setIsLoading(true);
      
      // Clear the existing response and mark as pending
      setChatHistory(prev => prev.map(c => 
        c.id === messageId 
          ? { ...c, response: null, pending: true }
          : c
      ));
      
      // Send the original message to get a new response
      regenerateResponse(chat.message);
    }
  };

  // Convert chat history to message format
  const messages = chatHistory.flatMap(chat => {
    const msgs = [{
      id: `user-${chat.id || chat.timestamp}`,
      messageId: chat.id,
      message: chat.message,
      isUser: true,
      timestamp: chat.timestamp
    }];
    
    if (chat.response && !chat.pending) {
      msgs.push({
        id: `ai-${chat.id || chat.timestamp}`,
        messageId: chat.id,
        message: chat.response,
        isUser: false,
        timestamp: chat.timestamp
      });
    }
    
    return msgs;
  });

  // Check if latest message is from AI
  const latestMessage = messages[messages.length - 1];
  const canRegenerate = latestMessage && !latestMessage.isUser;

  return (
    <Stack 
      h="100%" 
      gap={0} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-body)',
        overflow: 'hidden'
      }}
    >
      <ScrollArea 
        h={0}
        style={{ flex: 1 }} 
        px="md" 
        pt="md" 
        ref={scrollAreaRef}
        viewportProps={{
          style: { backgroundColor: 'var(--mantine-color-body)' }
        }}
      >
        {messages.length === 0 ? (
          <Center h="100%">
            <Stack align="center" gap="xs">
              <Text c="dimmed">Welcome to AuraFlow, {user?.name}!</Text>
              <Text size="sm" c="dimmed">Start a conversation about your productivity and mindfulness</Text>
            </Stack>
          </Center>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble 
              key={msg.id} 
              {...msg} 
              user={user} 
              onDelete={msg.isUser ? handleDeleteMessage : null}
              onRegenerate={!msg.isUser && canRegenerate && index === messages.length - 1 ? handleRegenerateResponse : null}
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
