import client from './client';

export async function login(email, password) {
  const { data } = await client.post('/api/users/login', { email, password });
  return data;
}

export async function register(userData) {
  const { data } = await client.post('/api/users/register', userData);
  return data;
}

export async function getMe() {
  const { data } = await client.get('/api/users/me');
  return data;
}

export async function forgotPassword(email) {
  const { data } = await client.post('/api/users/forgot-password', { email });
  return data;
}

export async function resetPassword(token, newPassword) {
  const { data } = await client.post('/api/users/reset-password', { token, newPassword });
  return data;
}

export async function googleAuth(idToken) {
  const { data } = await client.post('/api/users/oauth/google', { idToken });
  return data;
}

export async function linkedinAuth(code, redirectUri) {
  const { data } = await client.post('/api/users/oauth/linkedin', { code, redirectUri });
  return data;
}
