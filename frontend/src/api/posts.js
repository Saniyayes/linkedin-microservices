import client from './client';

export const getAllPosts = () => client.get('/api/posts').then((res) => res.data);
export const createPost = (authorId, authorName, content) =>
  client.post('/api/posts', { authorId, authorName, content }).then((res) => res.data.post);
