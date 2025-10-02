import { useState, useEffect, useRef } from 'react';
import { Stack, ScrollArea, Text, Loader, Center, Select } from '@mantine/core';
import { useSocket } from '../../hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

export const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { 
    isConnected, 
    sendMessage, 
    onAIResponse, 
    models, 
    selectedModel, 
    setSelectedModel 
  } = useSocket();
  const scrollAreaRef = useRef();

  useEffect(() => {
    const cleanup = onAIResponse((response) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: response.message,
        isUser: false,
        timestamp: response.timestamp,
        error: response.error
      }]);
      setIsLoading(false);
    });

    return cleanup;
  }, [onAIResponse]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  const handleSendMessage = (message) => {
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now(),
      message,
      isUser: true,
      timestamp: new Date().toISOString()
    }]);

    // Send to backend
    sendMessage(message);
    setIsLoading(true);
  };

  return (
    <Stack h="100%" gap={0}>
      <ScrollArea flex={1} p="md" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <Center h="100%">
            <Text c="dimmed">Start a conversation with AuraFlow</Text>
          </Center>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} {...msg} />
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
        <Select
          label="Model"
          placeholder="Select model"
          data={models.map(m => ({ value: m.id, label: m.id }))}
          value={selectedModel}
          onChange={setSelectedModel}
          size="xs"
        />
      </Stack>
    </Stack>
  );
};
