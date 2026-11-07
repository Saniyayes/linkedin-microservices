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
