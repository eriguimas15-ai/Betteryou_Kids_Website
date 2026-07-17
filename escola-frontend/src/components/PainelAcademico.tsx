import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { authHeaders, getToken } from '../api/auth';
import type { AlunoPerfil, Avaliacao, Falta, Turma } from '../types';

type AlunoResponse = {
  aluno: {
    perfil: AlunoPerfil;
    turma: Turma | null;
    notas: Avaliacao[];
    faltas: Falta[];
  }
};

export default function PainelAcademico() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alunoData, setAlunoData] = useState<AlunoResponse | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [mode, setMode] = useState<'aluno' | 'prof' | null>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setError('Sem token. Faça login.');
      setLoading(false);
      return;
    }

    // Try fetch aluno view first
    (async () => {
      try {
        const res = await apiFetch('/escola-backend/api-academico.php', { headers: authHeaders() });
        if (res.aluno) {
          setAlunoData(res);
          setMode('aluno');
        } else if (res.students) {
          setStudents(res.students);
          setMode('prof');
        } else {
          // If backend returned something else, try professor list
          const res2 = await apiFetch('/escola-backend/api-academico.php?action=list_students', { headers: authHeaders() });
          if (res2.students) {
            setStudents(res2.students);
            setMode('prof');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar dados');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  if (mode === 'aluno' && alunoData) {
    const { perfil, turma, notas, faltas } = alunoData.aluno;
    const notasByPeriodo: Record<string, Avaliacao[]> = {};
    notas.forEach(n => {
      (notasByPeriodo[n.periodo] ||= []).push(n);
    });

    return (
      <div>
        <h2>Painel do Aluno</h2>
        <div>
          <strong>Turma:</strong> {turma ? `${turma.nome} (${turma.ano || ''})` : 'Sem turma'}
        </div>
        <div>
          <h3>Notas</h3>
          {Object.keys(notasByPeriodo).length === 0 && <div>Sem avaliações.</div>}
          {Object.entries(notasByPeriodo).map(([periodo, arr]) => (
            <div key={periodo}>
              <h4>{periodo}</h4>
              <table border={1}>
                <thead>
                  <tr><th>Disciplina</th><th>Nota</th><th>Data</th></tr>
                </thead>
                <tbody>
                  {arr.map(n => (
                    <tr key={n.id}><td>{n.disciplina}</td><td>{n.nota}</td><td>{n.created_at}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div>
          <h3>Faltas</h3>
          {faltas.length === 0 && <div>Sem faltas registadas.</div>}
          {faltas.map(f => (
            <div key={f.id}>{f.data} — {f.disciplina} — {f.numero_faltas} falta(s) — {f.justificada ? 'Justificada' : 'Não justificada'}</div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'prof') {
    return (
      <ProfessorView students={students} />
    );
  }

  return <div>Sem dados para mostrar.</div>;
}

function ProfessorView({ students }: { students: any[] }) {
  const [selected, setSelected] = useState<number | null>(students.length ? students[0].perfil_id : null);
  const [disciplina, setDisciplina] = useState('');
  const [nota, setNota] = useState('');
  const [periodo, setPeriodo] = useState('Geral');
  const [msg, setMsg] = useState('');

  async function submitGrade(e: React.FormEvent) {
    e.preventDefault();
    setMsg('Enviando...');
    try {
      await apiFetch('/escola-backend/api-academico.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'add_grade', aluno_id: selected, disciplina, nota: parseFloat(nota), periodo })
      });
      setMsg('Nota adicionada com sucesso.');
    } catch (err: any) {
      setMsg('Erro: ' + err.message);
    }
  }

  async function submitAbsence(e: React.FormEvent) {
    e.preventDefault();
    setMsg('Enviando falta...');
    try {
      await apiFetch('/escola-backend/api-academico.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'add_absence', aluno_id: selected, disciplina, data: new Date().toISOString().slice(0,10), numero_faltas: 1, justificada: 0 })
      });
      setMsg('Falta registada.');
    } catch (err: any) {
      setMsg('Erro: ' + err.message);
    }
  }

  return (
    <div>
      <h2>Painel do Professor</h2>
      <div>
        <label>Aluno: <select value={selected || ''} onChange={e => setSelected(parseInt(e.target.value || '0'))}>
          {students.map(s => <option key={s.perfil_id} value={s.perfil_id}>{s.nome} — {s.numero_estudante || ''}</option>)}
        </select></label>
      </div>
      <form onSubmit={submitGrade}>
        <h3>Adicionar Nota</h3>
        <div><label>Disciplina: <input value={disciplina} onChange={e => setDisciplina(e.target.value)} /></label></div>
        <div><label>Nota: <input value={nota} onChange={e => setNota(e.target.value)} type="number" step="0.01" /></label></div>
        <div><label>Período: <input value={periodo} onChange={e => setPeriodo(e.target.value)} /></label></div>
        <button type="submit">Enviar Nota</button>
      </form>

      <form onSubmit={submitAbsence}>
        <h3>Registar Falta</h3>
        <div><label>Disciplina: <input value={disciplina} onChange={e => setDisciplina(e.target.value)} /></label></div>
        <button type="submit">Registar Falta</button>
      </form>

      <div>{msg}</div>
    </div>
  );
}
