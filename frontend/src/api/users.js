import client from './client';

export const getUser = (id) => client.get(`/api/users/${id}`).then((res) => res.data);
