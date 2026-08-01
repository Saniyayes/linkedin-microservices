import client from './client';

export const register = (payload) =>
  client.post('/api/users/register', payload).then((res) => res.data);

export const login = (email, password) =>
  client.post('/api/users/login', { email, password }).then((res) => res.data);
