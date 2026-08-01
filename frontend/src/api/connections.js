import client from './client';

export const getFollowers = (userId) =>
  client.get(`/api/connections/followers/${userId}`).then((res) => res.data);
export const getSecondDegree = (userId) =>
  client.get(`/api/connections/second-degree/${userId}`).then((res) => res.data);
export const sendRequest = (fromUserId, toUserId) =>
  client.post('/api/connections/request', { fromUserId, toUserId }).then((res) => res.data);
