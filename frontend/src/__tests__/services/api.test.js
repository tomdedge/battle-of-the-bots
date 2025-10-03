import ApiService from '../../services/api';

// Mock fetch
global.fetch = jest.fn();

describe('ApiService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('creates instance with token', () => {
    const api = new ApiService('test-token');
    expect(api.token).toBe('test-token');
    expect(api.baseURL).toBe('http://localhost:8080');
  });

  it('makes authenticated request to get tasks', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tasks: [] })
    });

    const api = new ApiService('test-token');
    const result = await api.getTasks();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/tasks',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    );
    expect(result).toEqual({ tasks: [] });
  });
});