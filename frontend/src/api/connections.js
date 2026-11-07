import client from './client';

export async function sendConnectionRequest(fromUserId, toUserId, fromUserName, toUserName) {
  const { data } = await client.post('/api/connections/request', {
    fromUserId: String(fromUserId),
    toUserId: String(toUserId),
    fromUserName,
    toUserName
  });
  return data;
}

export async function acceptConnectionRequest(fromUserId, toUserId) {
  const { data } = await client.post('/api/connections/accept', {
    fromUserId: String(fromUserId),
    toUserId: String(toUserId)
  });
  return data;
}

export async function rejectConnectionRequest(fromUserId, toUserId) {
  const { data } = await client.post('/api/connections/reject', {
    fromUserId: String(fromUserId),
    toUserId: String(toUserId)
  });
  return data;
}

export async function withdrawConnectionRequest(fromUserId, toUserId) {
  const { data } = await client.post('/api/connections/withdraw', {
    fromUserId: String(fromUserId),
    toUserId: String(toUserId)
  });
  return data;
}

export async function removeConnection(fromUserId, toUserId) {
  const { data } = await client.delete(`/api/connections/remove?fromUserId=${fromUserId}&toUserId=${toUserId}`);
  return data;
}

export async function getConnectionStatus(user1, user2) {
  const { data } = await client.get(`/api/connections/status?user1=${user1}&user2=${user2}`);
  return data;
}

export async function getAcceptedConnections(userId) {
  const { data } = await client.get(`/api/connections/${userId}`);
  return data;
}

export async function getPendingInvitations(userId) {
  const { data } = await client.get(`/api/connections/pending/${userId}`);
  return data;
}

export async function getSentInvitations(userId) {
  const { data } = await client.get(`/api/connections/sent/${userId}`);
  return data;
}

export async function followUser(followerId, followedId, followerName, followedName) {
  const { data } = await client.post('/api/connections/follow', {
    followerId: String(followerId),
    followedId: String(followedId),
    followerName,
    followedName
  });
  return data;
}

export async function unfollowUser(followerId, followedId) {
  const { data } = await client.post('/api/connections/unfollow', {
    followerId: String(followerId),
    followedId: String(followedId)
  });
  return data;
}

export async function getFollowing(userId) {
  const { data } = await client.get(`/api/connections/following/${userId}`);
  return data;
}

export async function getFollowers(userId) {
  const { data } = await client.get(`/api/connections/followers/${userId}`);
  return data;
}
