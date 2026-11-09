import client from './client';

export async function createPost(authorId, authorName, content, authorHeadline = '', authorAvatar = '', imageUrl = '', mediaType = 'TEXT') {
  const { data } = await client.post('/api/posts', {
    authorId: String(authorId),
    authorName,
    authorHeadline,
    authorAvatar,
    content,
    imageUrl,
    mediaUrl: imageUrl,
    mediaType
  });
  return data;
}

export async function getAllPosts(userId) {
  const { data } = await client.get(`/api/posts?userId=${userId || ''}`);
  return data;
}

export async function getPostsByAuthor(authorId, userId) {
  const { data } = await client.get(`/api/posts/author/${authorId}?userId=${userId || ''}`);
  return data;
}

export async function getPostById(id, userId) {
  const { data } = await client.get(`/api/posts/${id}?userId=${userId || ''}`);
  return data;
}

export async function updatePost(id, content, imageUrl) {
  const { data } = await client.put(`/api/posts/${id}`, { content, imageUrl });
  return data;
}

export async function deletePost(id) {
  const { data } = await client.delete(`/api/posts/${id}`);
  return data;
}

export async function toggleLike(postId, userId, userName, userAvatar) {
  const { data } = await client.post(`/api/posts/${postId}/like`, {
    userId: String(userId),
    userName,
    userAvatar
  });
  return data;
}

export async function addComment(postId, authorId, authorName, authorHeadline, authorAvatar, content) {
  const { data } = await client.post(`/api/posts/${postId}/comments`, {
    authorId: String(authorId),
    authorName,
    authorHeadline,
    authorAvatar,
    content
  });
  return data;
}

export async function getComments(postId) {
  const { data } = await client.get(`/api/posts/${postId}/comments`);
  return data;
}

export async function toggleSavePost(postId, userId) {
  const { data } = await client.post(`/api/posts/${postId}/save`, { userId: String(userId) });
  return data;
}

export async function getSavedPosts(userId) {
  const { data } = await client.get(`/api/posts/saved/${userId}`);
  return data;
}
