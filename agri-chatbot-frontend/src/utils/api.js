import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Language Selection
export const selectLanguage = async (language) => {
  const response = await api.post('/api/chat/language', { language });
  return response.data;
};

// Send Chat Message
export const sendMessage = async (sessionId, message, language) => {
  const response = await api.post('/api/chat/message', {
    session_id: sessionId,
    message,
    language,
  });
  return response.data;
};

// Transcribe Voice
export const transcribeVoice = async (audioBlob, sessionId, language) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('session_id', sessionId);
  formData.append('language', language);

  const response = await api.post('/api/voice/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Analyze Image
export const analyzeImage = async (imageFile, sessionId, language, context = '') => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('session_id', sessionId);
  formData.append('language', language);
  formData.append('additional_context', context);

  const response = await api.post('/api/image/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Text to Speech
export const textToSpeech = async (text, language) => {
  const response = await api.post('/api/tts/speak', { text, language });
  return response.data;
};

// Get Session History
export const getHistory = async (sessionId) => {
  const response = await api.get(`/api/session/${sessionId}/history`);
  return response.data;
};

// Clear History
export const clearHistory = async (sessionId) => {
  const response = await api.delete(`/api/session/${sessionId}/history`);
  return response.data;
};

export default api;