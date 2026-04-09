const API_BASE_URL = "http://localhost:5000/api";


export const api = {
  logout: () => {},
  hasToken: () => {
    return localStorage.getItem("token");
  },

  get: async (url) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }), //spreads auth object into header if token's truthy
      },
    });

    return handleResponse(res);
  },

  post: async (url, body) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    return handleResponse(res);
  },

  put: async (url, body) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    return handleResponse(res);
  },

  postFormData: async (url, formData) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return handleResponse(res);
  },

  putFormData: async (url, formData) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return handleResponse(res);
  },

  delete: async (url) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return handleResponse(res);
  },
};

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem("token");
    api.logout();
    throw new Error("401. Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => {});
    throw error;
  }

  if (res.status === 204) return null;

  return res.json();
}
