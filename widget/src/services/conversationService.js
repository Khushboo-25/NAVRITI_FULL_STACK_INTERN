import axios from "axios";

const API_URL = "http://localhost:5000/api/conversations";

export const createOrGetDirect = async (
  currentUserId,
  targetUserId
) => {
  const response = await axios.post(`${API_URL}/direct`, {
    currentUserId,
    targetUserId,
  });

  return response.data;
};

// NEW
export const getUserConversations = async (userId) => {
  const response = await axios.get(`${API_URL}/user/${userId}`);
  return response.data;
};
export const createGroup = async (groupName, currentUserId, participants) => {
  const response = await axios.post(`${API_URL}/group`, {
    groupName,
    currentUserId,
    participants,
  });
  return response.data;
};

