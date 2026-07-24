"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import Link from 'next/link';

interface Turma {
  id: string;
  nome: string;
  pontuacao: number;
}

interface Pergunta {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  nomeProfessor?: string;
}

export default function JogoPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta | null>(null);
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [pontosPorRodada, setPontosPorRodada] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadingPergunta, setLoadingPergunta] = useState(false);

  const fetchData = async () => {
    const resClasses = await fetch('/api/classes');
    const classes = await resClasses.json();
    setTurmas(classes);

    const resSettings = await fetch('/api/settings');
    const settings = await resSettings.json();
    if (settings) setPontosPorRodada(settings.pontosPorRodada);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSortear = async () => {
    setLoadingPergunta(true);
    setMostrarResposta(false);
    try {
      const res = await fetch('/api/questions?random=true');
      const data = await res.json();
      setPerguntaAtual(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPergunta(false);
    }
  };

  const handlePontuar = async (turmaId: string, operacao: 'add' | 'sub') => {
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;
    
    const novaPontuacao = operacao === 'add' 
      ? turma.pontuacao + pontosPorRodada 
      : Math.max(0, turma.pontuacao - pontosPorRodada);

    // Otimista
    setTurmas(prev => prev.map(t => t.id === turmaId ? { ...t, pontuacao: novaPontuacao } : t).sort((a,b) => b.pontuacao - a.pontuacao));
    
    await fetch(`/api/classes/${turmaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pontuacao: novaPontuacao })
    });
  };

  if (loading) return <div className="p-8 text-center">Carregando Jogo...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1>Ao Vivo: Torta na Cara</h1>
        <Link href="/">
          <Button variant="secondary">Sair do Jogo</Button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', flex: 1 }}>
        {/* Painel Principal (Perguntas) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Card className="flex-1 flex flex-col items-center justify-center text-center" style={{ minHeight: '400px' }}>
            {!perguntaAtual ? (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
                  Pronto para começar?
                </h2>
                <Button onClick={handleSortear} disabled={loadingPergunta} style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}>
                  {loadingPergunta ? 'Sorteando...' : 'Sortear Pergunta'}
                </Button>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ background: 'var(--primary)', padding: '0.25rem 1rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                  Categoria: {perguntaAtual.categoria}
                </span>
                
                <h2 style={{ fontSize: '2.5rem', lineHeight: '1.3', marginBottom: '3rem' }}>
                  {perguntaAtual.pergunta}
                </h2>

                {mostrarResposta ? (
                  <div className="animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--success)', padding: '1.5rem', borderRadius: '12px', width: '100%' }}>
                    <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Resposta:</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{perguntaAtual.resposta}</p>
                  </div>
                ) : (
                  <Button onClick={() => setMostrarResposta(true)} variant="secondary" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
                    Revelar Resposta
                  </Button>
                )}

                <div style={{ marginTop: '3rem' }}>
                  <Button onClick={handleSortear} disabled={loadingPergunta}>
                    Próxima Pergunta
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Placar */}
        <div>
          <Card style={{ height: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              Placar Geral
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {turmas.map((turma, index) => (
                <div key={turma.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {index === 0 && '🥇 '}
                      {index === 1 && '🥈 '}
                      {index === 2 && '🥉 '}
                      {turma.nome}
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent)' }}>
                      {turma.pontuacao}
                    </span>
                  </div>
                  
                  {/* Controles do placar para o apresentador */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={() => handlePontuar(turma.id, 'add')}
                      style={{ flex: 1, background: 'rgba(16,185,129,0.2)', color: 'var(--success)', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      + Acertou
                    </button>
                    <button 
                      onClick={() => handlePontuar(turma.id, 'sub')}
                      style={{ flex: 1, background: 'rgba(239,68,68,0.2)', color: 'var(--error)', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      - Errou (Torta)
                    </button>
                  </div>
                </div>
              ))}
              
              {turmas.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma turma cadastrada.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
