import client from './client';

export async function getUserProfile(id) {
  const { data } = await client.get(`/api/users/${id}`);
  return data;
}

export async function updateProfile(id, updates) {
  const { data } = await client.put(`/api/users/${id}`, updates);
  return data;
}

export async function addExperience(userId, exp) {
  const { data } = await client.post(`/api/users/${userId}/experience`, exp);
  return data;
}

export async function deleteExperience(userId, expId) {
  const { data } = await client.delete(`/api/users/${userId}/experience/${expId}`);
  return data;
}

export async function addEducation(userId, edu) {
  const { data } = await client.post(`/api/users/${userId}/education`, edu);
  return data;
}

export async function deleteEducation(userId, eduId) {
  const { data } = await client.delete(`/api/users/${userId}/education/${eduId}`);
  return data;
}

export async function addCertification(userId, cert) {
  const { data } = await client.post(`/api/users/${userId}/certification`, cert);
  return data;
}

export async function deleteCertification(userId, certId) {
  const { data } = await client.delete(`/api/users/${userId}/certification/${certId}`);
  return data;
}

export async function searchUsers(query) {
  const { data } = await client.get(`/api/users/search?q=${encodeURIComponent(query || '')}`);
  return data;
}

export async function getSuggestions(currentUserId) {
  const { data } = await client.get(`/api/users/suggestions?currentUserId=${currentUserId || ''}`);
  return data;
}
