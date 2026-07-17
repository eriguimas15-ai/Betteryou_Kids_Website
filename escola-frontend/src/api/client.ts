export async function apiFetch(path: string, options: RequestInit = {}) {
  const base = 'http://escola-backend.test';
  const res = await fetch(base + path, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  return res.json();
}
