import client from './client';

export async function createJob(jobData) {
  const { data } = await client.post('/api/posts/jobs', jobData);
  return data;
}

export async function getJobs(query = '', userId = '') {
  const { data } = await client.get(`/api/posts/jobs?q=${encodeURIComponent(query)}&userId=${userId || ''}`);
  return data;
}

export async function getJobDetails(id, userId = '') {
  const { data } = await client.get(`/api/posts/jobs/${id}?userId=${userId || ''}`);
  return data;
}

export async function applyForJob(id, applicationData) {
  const { data } = await client.post(`/api/posts/jobs/${id}/apply`, applicationData);
  return data;
}

export async function getMyApplications(userId) {
  const { data } = await client.get(`/api/posts/jobs/my-applications/${userId}`);
  return data;
}

export async function toggleSaveJob(id, userId) {
  const { data } = await client.post(`/api/posts/jobs/${id}/save`, { userId: String(userId) });
  return data;
}

export async function getSavedJobs(userId) {
  const { data } = await client.get(`/api/posts/jobs/saved/${userId}`);
  return data;
}
