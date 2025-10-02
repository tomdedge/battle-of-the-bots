import { useState, useEffect, useRef } from 'react';
import { Stack, ScrollArea, Text, Loader, Center } from '@mantine/core';
import { useSocket } from '../../hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

export const ChatInterface = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    isConnected, 
    sendMessage, 
    onAIResponse, 
    models, 
    selectedModel, 
    setSelectedModel,
    chatHistory,
    user
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

  // Convert chat history to message format
  const messages = chatHistory.flatMap(chat => {
    const msgs = [{
      id: `user-${chat.timestamp}`,
      message: chat.message,
      isUser: true,
      timestamp: chat.timestamp
    }];
    
    if (chat.response && !chat.pending) {
      msgs.push({
        id: `ai-${chat.timestamp}`,
        message: chat.response,
        isUser: false,
        timestamp: chat.timestamp
      });
    }
    
    return msgs;
  });

  return (
    <Stack h="100%" gap={0}>
      <ScrollArea flex={1} p="md" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <Center h="100%">
            <Stack align="center" gap="xs">
              <Text c="dimmed">Welcome to AuraFlow, {user?.name}!</Text>
              <Text size="sm" c="dimmed">Start a conversation about your productivity and mindfulness</Text>
            </Stack>
          </Center>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} {...msg} user={user} />
          ))
        )}
        {isLoading && (
          <Center mt="md">
            <Loader size="sm" />
          </Center>
        )}
      </ScrollArea>
      
      <Stack p="md" gap="xs">
        {!isConnected && (
          <Text size="xs" c="red">Connecting...</Text>
        )}
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={!isConnected || isLoading}
        />
      </Stack>
    </Stack>
  );
};
