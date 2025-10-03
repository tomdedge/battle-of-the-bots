import { useState, useEffect } from 'react';
import { TextInput, ActionIcon, Group } from '@mantine/core';
import { IconSend, IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition((finalText) => {
    console.log('ChatInput onComplete called with:', finalText);
    console.log('disabled:', disabled);
    if (finalText) {
      console.log('Calling onSendMessage with:', finalText);
      onSendMessage(finalText);
      setMessage('');
    } else {
      console.log('Not sending - no finalText');
    }
  });

  useEffect(() => {
    if (transcript && isListening) {
      setMessage(transcript);
    }
  }, [transcript, isListening]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group gap="xs">
        <TextInput
          flex={1}
          placeholder={isListening ? "Listening..." : "Ask Aurora anything..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
        />
        {isSupported && (
          <ActionIcon
            onClick={toggleListening}
            variant="filled"
            disabled={disabled}
            style={{
              backgroundColor: isListening ? '#ef4444' : 'var(--aura-primary)',
              color: 'white'
            }}
          >
            {isListening ? <IconMicrophoneOff size={16} /> : <IconMicrophone size={16} />}
          </ActionIcon>
        )}
        <ActionIcon
          type="submit"
          variant="filled"
          disabled={!message.trim() || disabled}
          style={{
            backgroundColor: 'var(--aura-primary)',
            color: 'white'
          }}
        >
          <IconSend size={16} />
        </ActionIcon>
      </Group>
    </form>
  );
};
