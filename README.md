# Middle layer

## Overview

This API provides endpoints for managing user accounts, including creation, authentication, data retrieval, and updates. It uses standard HTTP methods and returns JSON-formatted responses.

## Base URL

The base URL for the API will depend on the deployment environment. All endpoints described below are relative to this base URL.

## Common Headers

Requests and responses commonly include the following headers:

- **Content-Type**: `application/json;charset=utf-8`
- **Access-Control-Allow-Origin**: `*` (dynamically set to the request's origin)
- **Access-Control-Allow-Methods**: `GET, POST, DELETE`

## Authentication

Some endpoints require an `Authorization` header with a valid token obtained through the login process.

## Endpoints

### POST /signup

Creates a new user account.

- **Request Body**: JSON object containing `user` (string) and `password` (string).
- **Success Response**: `200 OK` with body `{"response": "User created successfully"}`.
- Error Responses:
  - `405 Method Not Allowed` if method other than POST is used.
  - `405 Method Not Allowed` if `user` or `password` is missing.

### GET /login?user={username}

Authenticates a user and retrieves a session token.

- **Required Parameters**: `user` query parameter to specify the username.
- **Success Response**: `200 OK` with user info and `Authorization` token in headers.
- Error Responses:
  - `405 Method Not Allowed` if method other than GET is used.
  - `404 Not Found` for invalid user or password.
  - `404 Not Found` if account not found.

### DELETE /signout?user={username}

Logs out a user by invalidating the current session token.

- **Required Parameters**: `user` query parameter to specify the username.
- **Success Response**: `200 OK` with body `{"response": "Logged out"}`.
- Error Responses:
  - `405 Method Not Allowed` if method other than DELETE is used.
  - `405 Method Not Allowed` if not authenticated or already logged out.

### GET /getinfo?user={username}

Retrieves user information for an authenticated session.

- **Required Parameters**: `user` query parameter to specify the username.
- **Success Response**: `200 OK` with user info in the body.
- Error Responses:
  - `405 Method Not Allowed` if method other than GET is used.
  - `405 Method Not Allowed` if not authenticated.

### POST /avatar?user={username}

Updates the user's avatar.

- **Required Parameters**: `user` query parameter to specify the username.
- **Request Body**: JSON object containing `avatar` (base64-encoded image string).
- **Success Response**: `200 OK` with body `{"response": "Updated"}`.
- Error Responses:
  - `405 Method Not Allowed` if method other than POST is used.
  - `405 Method Not Allowed` if not authenticated.

### GET /avatar?user={username}

Retrieves the user's avatar.

- **Required Parameters**: `user` query parameter to specify the username.
- **Success Response**: `200 OK` with avatar data in the body.
- Error Responses:
  - `405 Method Not Allowed` if method other than GET is used.
  - `405 Method Not Allowed` if not authenticated.

### POST /history?user={username}

Updates the user's chat history.

- **Required Parameters**: `user` query parameter to specify the username.
- **Request Body**: JSON object containing `history` (object with chat history data).
- **Success Response**: `200 OK` with body `{"response": "Updated"}`.
- Error Responses:
  - `405 Method Not Allowed` if method other than POST is used.
  - `405 Method Not Allowed` if not authenticated.

### GET /history?user={username}

Retrieves the user's chat history.

- **Required Parameters**: `user` query parameter to specify the username.
- **Success Response**: `200 OK` with history data in the body.
- Error Responses:
  - `405 Method Not Allowed` if method other than GET is used.
  - `405 Method Not Allowed` if not authenticated.

## Error Handling

Error responses include a status code and a JSON body with a `response` key indicating the nature of the error.

## Notes

- All user-related actions require specifying the `user` parameter in the query string where applicable.
- The `Authorization` header is required for authenticated endpoints and should contain the session token obtained upon successful login.
- Ensure to URL-encode the `user` parameter if it contains special characters or spaces.
- The `user` query parameter is case-insensitive. The API will process it in lowercase to ensure consistent identification.
