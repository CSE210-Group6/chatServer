import { describe, it, expect, beforeEach, vi } from 'vitest';
import { default as handler } from './index'; // Adjust the import based on your file structure

// Mock `env.chat.get` and `env.chat.put` functionality
const mockGet = vi.fn();
const mockPut = vi.fn();

// Mock `fetch` request and response
const mockRequest = (method, body) => ({
  method,
  headers: {
    get: () => 'test-origin',
  },
  json: () => Promise.resolve(body),
  url: 'https://example.com/signup',
});

const env = {
  chat: {
    get: mockGet,
    put: mockPut,
  },
};


describe('API handler tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('signup - success', async () => {
    const requestBody = { user: 'newuser', password: 'newpass' };
    const request = mockRequest('POST', requestBody);

    // Mock `chat.get` to simulate user does not exist
    mockGet.mockResolvedValueOnce(null);

    const response = await handler.fetch(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');
    expect(responseData.response).toBe('User created successfully');
    expect(mockPut).toHaveBeenCalledWith('newuser', expect.any(String));
  });

  it('signup - missing user or password', async () => {
    const requestBody = {}; // Missing user and password
    const request = mockRequest('POST', requestBody);

    const response = await handler.fetch(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(405);
    expect(response.statusText).toBe('Not Found');
    expect(responseData.response).toBe('Missing user or password');
  });

  it('signup - user already exists', async () => {
    const requestBody = { user: 'existinguser', password: 'newpass' };
    const request = mockRequest('POST', requestBody);

    // Mock `chat.get` to simulate user already exists
    mockGet.mockResolvedValueOnce(JSON.stringify({}));

    const response = await handler.fetch(request, env);
    const responseData = await response.json();

    expect(response.status).toBe(405);
    expect(response.statusText).toBe('Not Found');
    expect(responseData.response).toBe('User already exists');
  });

  it('returns Not Found for unknown paths', async () => {
    const mockRequest = {
      method: 'GET',
      url: 'https://example.com/unknownpath',
      headers: new Headers({
        'Origin': 'https://example.com'
      }),
      json: vi.fn(() => Promise.resolve({})),
    };

    const mockEnv = {};

    const response = await handler.fetch(mockRequest, mockEnv);

    expect(response.status).toBe(404);
    expect(response.statusText).toBe('Not Found');

  });

  it('handles signout successfully', async () => {
    const mockRequest = {
      method: 'DELETE',
      url: 'https://example.com/signout?user=a',
      headers: new Headers({
        'Authorization': 'validAuthToken', // Assuming this is how you authenticate
        'Origin': 'https://example.com',
      }),
    };

    const mockEnv = {
      chat: {
        get: vi.fn().mockResolvedValueOnce(JSON.stringify({
          authentication: ['validAuthToken'], // Indicate user is authenticated
        })),
        put: vi.fn(),
      }
    };

    const response = await handler.fetch(mockRequest, mockEnv);

    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.response).toBe("Logged out");
  });

  it('retrieves user history successfully', async () => {
    const mockRequest = {
      method: 'GET',
      url: 'https://example.com/history?user=testuser',
      headers: new Headers({
        'Authorization': 'validAuthToken',
        'Origin': 'https://example.com',
      }),
    };

    const mockEnv = {
      chat: {
        get: vi.fn().mockResolvedValueOnce(JSON.stringify({
          history: { "messages": [] }, // Example history object
          authentication: ['validAuthToken'],
        })),
      }
    };

    const response = await handler.fetch(mockRequest, mockEnv);

    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData).toEqual({ "response": { "messages": [] } });
  });

  it('updates user avatar successfully', async () => {
    const mockRequest = {
      method: 'POST',
      url: 'https://example.com/avatar?user=a',
      headers: new Headers({
        'Authorization': 'validAuthToken',
        'Origin': 'https://example.com',
      }),
      json: vi.fn(() => Promise.resolve({ avatar: 'newAvatarData' })), // Mock payload
    };

    const mockEnv = {
      chat: {
        get: vi.fn().mockResolvedValueOnce(JSON.stringify({
          authentication: ['validAuthToken'],
        })),
        put: vi.fn(),
      }
    };

    const response = await handler.fetch(mockRequest, mockEnv);

    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.response).toBe("Updated");
  });

  it('fails to login with incorrect password', async () => {
    // Mock request with incorrect password
    const mockRequest = {
      method: 'GET',
      url: 'https://example.com/login?user=testuser',
      headers: new Headers({
        'Authorization': 'wrongpassword',
        'Origin': 'https://example.com',
      }),
    };

    // Mock environment similar to the successful login but with a different password
    const mockEnv = {
      chat: {
        get: vi.fn().mockResolvedValueOnce(JSON.stringify({
          password: 'testpassword', // Stored password does not match request
          history: {},
          avatar: 'data:image/png;base64,...',
          logincount: 0,
          authentication: [],
        })),
      }
    };

    // Calling the handler
    const response = await handler.fetch(mockRequest, mockEnv);

    // Assertions for failure
    expect(response.status).toBe(404); // Assuming you return 404 or another status for incorrect credentials
    const responseData = await response.json();
    expect(responseData.response).toBe('Invalid user or password'); // Ensure the response indicates a login failure
  });

  it('logs in successfully with correct credentials', async () => {
    // Mock request for login
    const mockRequest = {
      method: 'GET', // Assuming login uses GET with headers for credentials
      url: 'https://example.com/login?user=testuser',
      headers: new Headers({
        'Authorization': 'testpassword', // Assuming the password is sent via Authorization header
        'Origin': 'https://example.com',
      }),
    };

    // Mock environment
    const mockEnv = {
      chat: {
        get: vi.fn().mockResolvedValueOnce(JSON.stringify({
          password: 'testpassword', // Mocking stored user info with matching password
          history: {}, // Example user info
          avatar: 'data:image/png;base64,...',
          logincount: 0,
          authentication: [],
        })),
        put: vi.fn(), // Mock put to simulate updating the user info
      }
    };

    // Calling the handler
    const response = await handler.fetch(mockRequest, mockEnv);

    // Assertions for success
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.logincount).toBe(0); // Assuming logincount should increment upon successful login
    expect(mockEnv.chat.put).toHaveBeenCalled(); // Ensure user info is updated with new logincount and/or auth token
  });
});