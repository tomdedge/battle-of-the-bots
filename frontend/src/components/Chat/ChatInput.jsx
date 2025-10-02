import { useState } from 'react';
import { TextInput, ActionIcon, Group } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

export const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group gap="xs">
        <TextInput
          flex={1}
          placeholder="Ask AuraFlow anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
        />
        <ActionIcon
          type="submit"
          variant="filled"
          color="aura.1"
          disabled={!message.trim() || disabled}
        >
          <IconSend size={16} />
        </ActionIcon>
      </Group>
    </form>
  );
};
