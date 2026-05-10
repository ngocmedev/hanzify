const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export const registerUser = async (username: string, email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to register');
  }

  return response.json();
};

export const loginUser = async (username: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to login');
  }

  const data = await response.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('username', data.username);
  localStorage.setItem('role', data.role);
  
  window.dispatchEvent(new Event('auth_change'));
  
  return data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  window.dispatchEvent(new Event('auth_change'));
};

export const getLoggedInUsername = () => {
  return localStorage.getItem('username');
};

export const getLoggedInUserRole = () => {
  return localStorage.getItem('role');
};
