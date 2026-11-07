import client from './client';

export async function getConversations(userId) {
  const { data } = await client.get(`/api/chat/conversations/${userId}`);
  return data;
}

export async function getOrCreateConversation(user1Id, user2Id, user1Name, user2Name, user1Avatar, user2Avatar) {
  const { data } = await client.post('/api/chat/conversations', {
    user1Id: String(user1Id),
    user2Id: String(user2Id),
    user1Name,
    user2Name,
    user1Avatar,
    user2Avatar
  });
  return data;
}

export async function getMessages(conversationId) {
  const { data } = await client.get(`/api/chat/messages/${conversationId}`);
  return data;
}

export async function sendMessage(conversationId, senderId, senderName, senderAvatar, receiverId, content) {
  const { data } = await client.post('/api/chat/messages', {
    conversationId,
    senderId: String(senderId),
    senderName,
    senderAvatar,
    receiverId: String(receiverId),
    content
  });
  return data;
}

export async function markMessagesRead(conversationId, userId) {
  const { data } = await client.put(`/api/chat/messages/read/${conversationId}/${userId}`);
  return data;
}
