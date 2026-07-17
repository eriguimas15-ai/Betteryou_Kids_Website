export function getToken(): string | null {
  return localStorage.getItem('escola_token');
}

export function setToken(token: string) {
  localStorage.setItem('escola_token', token);
}

export function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { 'Authorization': 'Bearer ' + t } : {};
}
