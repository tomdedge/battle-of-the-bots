import { Modal, Stack, Text, Group, Avatar, Paper, Button, Loader } from '@mantine/core';
import ReactMarkdown from 'react-markdown';

export function AuroraResponseModal({ opened, onClose, response, isLoading }) {
  const modalTitle = isLoading ? "Scheduling Task" : "Aurora's Response";
  
  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={modalTitle} 
      centered
      size="md"
    >
      <Stack gap="lg">
        {isLoading ? (
          <Group align="center" gap="md">
            <Loader size="sm" />
            <Text size="sm">Aurora is scheduling your task...</Text>
          </Group>
        ) : (
          <Group align="flex-start" gap="md">
            <Avatar 
              src="/aurora.jpg"
              size="lg" 
              radius="xl"
              color="aura"
            >
              A
            </Avatar>
            
            <Paper 
              p="md" 
              radius="lg" 
              style={{ 
                flex: 1,
                backgroundColor: 'var(--mantine-color-gray-0)',
                border: '1px solid var(--mantine-color-gray-2)'
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <Text size="sm" c="dark">{children}</Text>,
                  a: ({ href, children }) => (
                    <Text 
                      component="a" 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      c="blue" 
                      td="underline"
                      size="sm"
                    >
                      {children}
                    </Text>
                  )
                }}
              >
                {typeof response === 'string' ? response : response?.message || 'Task scheduled successfully!'}
              </ReactMarkdown>
            </Paper>
          </Group>
        )}
        
        {!isLoading && (
          <Group justify="flex-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
