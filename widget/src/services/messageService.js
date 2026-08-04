import axios from "axios";

const API_URL = "http://localhost:5000/api/messages";

export const getMessages = async (conversationId) => {
  const response = await axios.get(`${API_URL}/${conversationId}`);
  return response.data;
};