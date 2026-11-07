import client from './client';

export async function getNotifications(userId) {
  const { data } = await client.get(`/api/feed/notifications/${userId}`);
  return data;
}

export async function getUnreadNotificationCount(userId) {
  const { data } = await client.get(`/api/feed/notifications/unread-count/${userId}`);
  return data.unreadCount;
}

export async function markNotificationRead(id) {
  const { data } = await client.put(`/api/feed/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(userId) {
  const { data } = await client.put(`/api/feed/notifications/read-all/${userId}`);
  return data;
}
