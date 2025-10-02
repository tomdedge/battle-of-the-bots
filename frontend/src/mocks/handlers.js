import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Google OAuth redirect - immediately redirect with token
  http.get('http://localhost:8080/auth/google', () => {
    return HttpResponse.redirect('http://localhost:3000?token=mock-jwt-token');
  }),

  // Mock chat history endpoint
  http.get('http://localhost:8080/auth/chat/history', () => {
    return HttpResponse.json([]);
  }),

  // Mock health check
  http.get('http://localhost:8080/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  })
];
