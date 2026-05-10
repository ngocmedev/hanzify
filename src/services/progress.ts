const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const updateProgress = async (wordId: string, status: 'learned' | 'not_learned' | 'urgent') => {
  const response = await fetch(`${API_URL}/progress`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ wordId, status }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update progress');
  }

  return response.json();
};

export const getProgressSummary = async () => {
  const response = await fetch(`${API_URL}/progress/summary`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch progress summary');
  }

  return response.json();
};

export const toggleStar = async (wordId: string) => {
  const response = await fetch(`${API_URL}/progress/toggle-star`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ wordId }),
  });

  if (!response.ok) {
    throw new Error('Failed to toggle star');
  }

  return response.json();
};
