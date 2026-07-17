import React, { useState } from 'react';
import { apiFetch } from '../api/client';
import { setToken } from '../api/auth';

type LoginProps = {
  onLogin: (user: { nome: string; tipo: string }) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('admin@escola.test');
  const [senha, setSenha] = useState('TmpStrongP@ssw0rd!');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('A iniciar sessão...');

    try {
      const result = await apiFetch('/api-login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (result.token) {
        setToken(result.token);
        onLogin(result.user);
        setMessage('Login bem sucedido');
        return;
      }

      setMessage('Resposta inesperada do servidor.');
    } catch (error: any) {
      setMessage(error.message || 'Erro no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 16, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8 }} type="email" required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Senha</label>
          <input value={senha} onChange={e => setSenha(e.target.value)} style={{ width: '100%', padding: 8 }} type="password" required />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '10px 16px' }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {message && <p style={{ marginTop: 16, color: message.includes('Erro') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}
