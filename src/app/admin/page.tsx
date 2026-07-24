"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import Link from 'next/link';

interface Turma {
  id: string;
  nome: string;
  pontuacao: number;
  _count: { alunos: number };
}

export default function AdminPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [novaTurma, setNovaTurma] = useState('');
  const [pontosPorRodada, setPontosPorRodada] = useState(10);
  const [loading, setLoading] = useState(true);

  const fetchTurmas = async () => {
    const res = await fetch('/api/classes');
    const data = await res.json();
    setTurmas(data);
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data) setPontosPorRodada(data.pontosPorRodada);
    setLoading(false);
  };

  useEffect(() => {
    fetchTurmas();
    fetchSettings();
  }, []);

  const handleCriarTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTurma.trim()) return;
    
    await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novaTurma })
    });
    setNovaTurma('');
    fetchTurmas();
  };

  const handleUpdateSettings = async () => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pontosPorRodada })
    });
    alert('Configurações salvas!');
  };

  const handleDeleteTurma = async (id: string) => {
    if (!confirm('Deseja excluir esta turma?')) return;
    await fetch(`/api/classes/${id}`, { method: 'DELETE' });
    fetchTurmas();
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1>Painel Admin</h1>
        <Link href="/">
          <Button variant="secondary">Voltar ao Início</Button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <Card>
          <h2>Configurações do Jogo</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Pontos ganhos por rodada</label>
              <input 
                type="number" 
                value={pontosPorRodada} 
                onChange={(e) => setPontosPorRodada(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleUpdateSettings}>Salvar Configurações</Button>
          </div>
        </Card>

        <Card>
          <h2>Nova Turma</h2>
          <form onSubmit={handleCriarTurma} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome da Turma</label>
              <input 
                type="text" 
                value={novaTurma} 
                onChange={(e) => setNovaTurma(e.target.value)}
                placeholder="Ex: 3º Ano B"
              />
            </div>
            <Button type="submit">Adicionar Turma</Button>
          </form>
        </Card>
      </div>

      <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Turmas Cadastradas</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {turmas.map(turma => (
          <Card key={turma.id} className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>{turma.nome}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{turma._count.alunos} alunos inscritos | {turma.pontuacao} pontos</p>
              
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Link de Inscrição: <br/>
                <a href={`/turma/${turma.id}`} target="_blank" style={{ color: 'var(--secondary)' }}>
                  {window.location.origin}/turma/{turma.id}
                </a>
              </div>
            </div>
            <Button onClick={() => handleDeleteTurma(turma.id)} style={{ background: 'var(--error)' }}>
              Excluir
            </Button>
          </Card>
        ))}
        
        {turmas.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            Nenhuma turma cadastrada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
