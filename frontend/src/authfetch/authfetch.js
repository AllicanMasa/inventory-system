export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("access_token");

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("access_token");
    window.location.href = "/";
    return null;
  }

  return res;
};