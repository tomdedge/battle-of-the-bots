import { renderHook, act } from '@testing-library/react';
import { useSocket } from '../../hooks/useSocket';
import * as socketService from '../../services/socket';
import * as AuthContext from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../services/socket');
jest.mock('../../contexts/AuthContext');

describe('useSocket Hook', () => {
  let mockSocket;
  let mockAuth;

  beforeEach(() => {
    mockSocket = {
      connected: true,
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    };

    mockAuth = {
      token: 'test-token',
      isAuthenticated: true,
      user: { id: 1, name: 'Test User' }
    };

    socketService.connectSocket = jest.fn(() => mockSocket);
    socketService.disconnectSocket = jest.fn();
    socketService.socket = mockSocket;
    AuthContext.useAuth = jest.fn(() => mockAuth);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.messages).toEqual([]);
    expect(result.current.models).toEqual([]);
    expect(result.current.selectedModel).toBeNull();
  });

  it('connects socket when authenticated', () => {
    renderHook(() => useSocket());

    expect(socketService.connectSocket).toHaveBeenCalledWith('test-token');
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('models', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('messages', expect.any(Function));
  });

  it('does not connect when not authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      token: null,
      isAuthenticated: false,
      user: null
    });

    const { result } = renderHook(() => useSocket());

    expect(socketService.connectSocket).not.toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
  });

  it('handles models event', () => {
    const { result } = renderHook(() => useSocket());

    const modelsData = {
      models: ['gpt-4', 'gpt-3.5'],
      initialModel: 'gpt-4',
      user: {
        tts_enabled: true,
        tts_voice: 'default',
        tts_rate: 1.0,
        tts_pitch: 1.0
      }
    };

    // Simulate models event
    const modelsCallback = mockSocket.on.mock.calls.find(call => call[0] === 'models')[1];
    act(() => {
      modelsCallback(modelsData);
    });

    expect(result.current.models).toEqual(['gpt-4', 'gpt-3.5']);
    expect(result.current.selectedModel).toBe('gpt-4');
    expect(result.current.ttsPreferences).toEqual({
      tts_enabled: true,
      tts_voice: 'default',
      tts_rate: 1.0,
      tts_pitch: 1.0
    });
  });

  it('handles messages event', () => {
    const { result } = renderHook(() => useSocket());

    const messages = [
      { id: 1, content: 'Hello', sender: 'user' },
      { id: 2, content: 'Hi there', sender: 'aurora' }
    ];

    // Simulate messages event
    const messagesCallback = mockSocket.on.mock.calls.find(call => call[0] === 'messages')[1];
    act(() => {
      messagesCallback(messages);
    });

    expect(result.current.messages).toEqual(messages);
  });

  it('handles messages cleared event', () => {
    const { result } = renderHook(() => useSocket());

    // First set some messages
    const messagesCallback = mockSocket.on.mock.calls.find(call => call[0] === 'messages')[1];
    act(() => {
      messagesCallback([{ id: 1, content: 'Hello', sender: 'user' }]);
    });

    // Then clear them
    const clearCallback = mockSocket.on.mock.calls.find(call => call[0] === 'messages_cleared')[1];
    act(() => {
      clearCallback();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('sends message when connected', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.sendMessage('Hello world');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('chat_message', {
      message: 'Hello world',
      model: null
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello world');
    expect(result.current.messages[0].sender).toBe('user');
  });

  it('does not send message when not connected', () => {
    mockSocket.connected = false;
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.sendMessage('Hello world');
    });

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('sends task message with callback', () => {
    const { result } = renderHook(() => useSocket());
    const callback = jest.fn();

    act(() => {
      result.current.sendTaskMessage('Create task', callback);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('task_message', {
      message: 'Create task',
      model: null
    });
    expect(mockSocket.on).toHaveBeenCalledWith('task_response', expect.any(Function));
  });

  it('handles model change', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.setSelectedModel('gpt-4');
    });

    expect(result.current.selectedModel).toBe('gpt-4');
    expect(mockSocket.emit).toHaveBeenCalledWith('update_model_preference', {
      model: 'gpt-4'
    });
  });

  it('clears chat history', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.clearChatHistory();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('clear_messages');
  });

  it('regenerates response', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.regenerateResponse('Original message');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('chat_message', {
      message: 'Original message',
      model: null
    });
  });

  it('injects aurora message', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.injectAuroraMessage('Aurora message');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('inject_aurora_message', {
      message: 'Aurora message'
    });
  });

  it('updates TTS preferences', () => {
    const { result } = renderHook(() => useSocket());

    const newPrefs = { tts_enabled: false, tts_rate: 1.5 };

    act(() => {
      result.current.updateTTSPreferences(newPrefs);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('update_tts_preference', newPrefs);
  });

  it('sets up AI response listener', () => {
    const { result } = renderHook(() => useSocket());
    const callback = jest.fn();

    const cleanup = result.current.onAIResponse(callback);

    expect(mockSocket.on).toHaveBeenCalledWith('ai_response', callback);
    
    cleanup();
    expect(mockSocket.off).toHaveBeenCalledWith('ai_response', callback);
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useSocket());

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('models', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('messages', expect.any(Function));
    expect(socketService.disconnectSocket).toHaveBeenCalled();
  });
});