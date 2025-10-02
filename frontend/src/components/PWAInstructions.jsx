import { Paper, Text, List, Button } from '@mantine/core';
import { useState } from 'react';

export const PWAInstructions = () => {
  const [show, setShow] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      <Button 
        size="xs" 
        style={{ position: 'fixed', top: 10, left: 10, zIndex: 9999 }}
        onClick={() => setShow(!show)}
      >
        PWA Help
      </Button>
      
      {show && (
        <Paper 
          p="md" 
          style={{ 
            position: 'fixed', 
            top: 50, 
            left: 10, 
            right: 10, 
            zIndex: 9998,
            maxWidth: 400
          }}
        >
          <Text fw={600} mb="sm">Find Your Installed PWA:</Text>
          <List size="sm">
            <List.Item>Type <code>chrome://apps/</code> in address bar</List.Item>
            <List.Item>Check browser menu → More tools → Create shortcut</List.Item>
            <List.Item>Look for install icon in address bar</List.Item>
            <List.Item>Search "AuraFlow" in Spotlight (Cmd+Space)</List.Item>
          </List>
          <Button size="xs" mt="sm" onClick={() => setShow(false)}>Close</Button>
        </Paper>
      )}
    </>
  );
};