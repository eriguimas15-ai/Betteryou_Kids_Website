import React, { useState } from 'react';
import { apiFetch } from '../api/client';
import { authHeaders } from '../api/auth';

export default function GerenciadorConteudo() {
  const [slug, setSlug] = useState('home');
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  async function savePage(e: React.FormEvent) {
    e.preventDefault();
    setMsg('Salvando...');
    try {
      await apiFetch('/escola-backend/api-paginas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ slug, titulo, conteudo })
      });
      setMsg('Página salva.');
    } catch (err: any) {
      setMsg('Erro: ' + err.message);
    }
  }

  async function uploadCarousel(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setMsg('Escolha um ficheiro.');
    setMsg('Enviando imagem...');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('http://escola-backend.test/api-carrossel.php', {
        method: 'POST',
        headers: { ...authHeaders() },
        body: fd
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg('Imagem enviada com sucesso.');
    } catch (err: any) {
      setMsg('Erro: ' + err.message);
    }
  }

  return (
    <div>
      <h2>Gerenciador de Conteúdo</h2>
      <form onSubmit={savePage}>
        <div><label>Slug: <input value={slug} onChange={e => setSlug(e.target.value)} /></label></div>
        <div><label>Título: <input value={titulo} onChange={e => setTitulo(e.target.value)} /></label></div>
        <div><label>Conteúdo: <textarea value={conteudo} onChange={e => setConteudo(e.target.value)} /></label></div>
        <button type="submit">Salvar Página</button>
      </form>

      <hr />

      <form onSubmit={uploadCarousel} encType="multipart/form-data">
        <div><input type="file" accept="image/*" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} /></div>
        <button type="submit">Enviar para Carrossel</button>
      </form>

      <div>{msg}</div>
    </div>
  );
}
