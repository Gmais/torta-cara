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
}

interface Duelo {
  t1: Turma;
  t2: Turma;
}

export default function JogoPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [duelos, setDuelos] = useState<Duelo[]>([]);
  
  // Estados do Jogo (Persistidos no localStorage)
  const [rodada, setRodada] = useState(1);
  const [dueloIndex, setDueloIndex] = useState(0);
  const [pontosValendo, setPontosValendo] = useState(10);
  
  // Estado Local (Não persistido)
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta | null>(null);
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPergunta, setLoadingPergunta] = useState(false);
  
  // Categorias para o filtro
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(''); // '' = Aleatório

  // Carrega dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      const resClasses = await fetch('/api/classes');
      const classes = await resClasses.json();
      setTurmas(classes);

      const resCat = await fetch('/api/categories');
      const cats = await resCat.json();
      setCategorias(cats);

      // Gera os duelos (Round Robin)
      const novosDuelos: Duelo[] = [];
      for (let i = 0; i < classes.length; i++) {
        for (let j = i + 1; j < classes.length; j++) {
          novosDuelos.push({ t1: classes[i], t2: classes[j] });
        }
      }
      setDuelos(novosDuelos);

      // Recupera estado salvo
      const savedState = localStorage.getItem('torta_cara_gameState');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setRodada(parsed.rodada || 1);
          // Previne index out of bounds caso uma turma tenha sido excluída
          setDueloIndex(parsed.dueloIndex < novosDuelos.length ? parsed.dueloIndex : 0);
          setPontosValendo(parsed.pontosValendo || 10);
        } catch(e) {}
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Salva o estado sempre que mudar
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('torta_cara_gameState', JSON.stringify({
        rodada,
        dueloIndex,
        pontosValendo
      }));
    }
  }, [rodada, dueloIndex, pontosValendo, loading]);

  const handleSortear = async () => {
    setLoadingPergunta(true);
    setMostrarResposta(false);
    try {
      const url = categoriaFiltro 
        ? `/api/questions?random=true&categoria=${encodeURIComponent(categoriaFiltro)}`
        : '/api/questions?random=true';
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.id) {
        setPerguntaAtual(data);
      } else {
        alert('Nenhuma pergunta encontrada para esta categoria.');
        setPerguntaAtual(null);
      }
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
      ? turma.pontuacao + pontosValendo 
      : Math.max(0, turma.pontuacao - pontosValendo);

    // Atualiza otimista (Reflete na tabela de duelos e no placar lateral)
    setTurmas(prev => prev.map(t => t.id === turmaId ? { ...t, pontuacao: novaPontuacao } : t).sort((a,b) => b.pontuacao - a.pontuacao));
    setDuelos(prev => prev.map(d => ({
      t1: d.t1.id === turmaId ? { ...d.t1, pontuacao: novaPontuacao } : d.t1,
      t2: d.t2.id === turmaId ? { ...d.t2, pontuacao: novaPontuacao } : d.t2,
    })));
    
    await fetch(`/api/classes/${turmaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pontuacao: novaPontuacao })
    });
  };

  const proximoDuelo = () => {
    setPerguntaAtual(null);
    setMostrarResposta(false);
    
    if (dueloIndex + 1 >= duelos.length) {
      // Fim da rodada, volta pro primeiro duelo e aumenta o contador de rodadas
      setDueloIndex(0);
      setRodada(r => r + 1);
    } else {
      setDueloIndex(i => i + 1);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando Jogo...</div>;

  if (turmas.length < 2) {
    return (
      <div className="p-8 text-center">
        <h2>Você precisa cadastrar pelo menos 2 turmas no Admin para iniciar o jogo.</h2>
        <Link href="/admin"><Button className="mt-4">Ir para o Admin</Button></Link>
      </div>
    );
  }

  const dueloAtual = duelos[dueloIndex];
  // Pegamos a turma mais atualizada do estado global para garantir pontuação real time no duelo
  const turma1 = turmas.find(t => t.id === dueloAtual.t1.id) || dueloAtual.t1;
  const turma2 = turmas.find(t => t.id === dueloAtual.t2.id) || dueloAtual.t2;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in min-h-screen flex flex-col">
      {/* Header com controles Rápidos */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ marginBottom: '0.2rem' }}>Ao Vivo: Torta na Cara</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
            Rodada {rodada} | Duelo {dueloIndex + 1} de {duelos.length}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>Valendo:</span>
            <input 
              type="number" 
              value={pontosValendo}
              onChange={(e) => setPontosValendo(Number(e.target.value))}
              style={{ width: '80px', margin: 0, padding: '0.25rem', textAlign: 'center' }}
            />
            <span style={{ fontWeight: 'bold' }}>pontos</span>
          </div>
          <Link href="/">
            <Button variant="secondary">Sair do Jogo</Button>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', flex: 1 }}>
        {/* Painel Principal (Duelo e Perguntas) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Box do Duelo Atual */}
          <Card style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.1), rgba(139,92,246,0.1))', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Equipe 1 */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '2.5rem' }}>{turma1.nome}</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <Button onClick={() => handlePontuar(turma1.id, 'add')} style={{ background: 'var(--success)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>+ Acertou</Button>
                  <Button onClick={() => handlePontuar(turma1.id, 'sub')} style={{ background: 'var(--error)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>- Errou</Button>
                </div>
              </div>

              {/* VS */}
              <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--accent)', margin: '0 2rem', fontStyle: 'italic' }}>
                VS
              </div>

              {/* Equipe 2 */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '2.5rem' }}>{turma2.nome}</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <Button onClick={() => handlePontuar(turma2.id, 'add')} style={{ background: 'var(--success)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>+ Acertou</Button>
                  <Button onClick={() => handlePontuar(turma2.id, 'sub')} style={{ background: 'var(--error)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>- Errou</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Box da Pergunta */}
          <Card className="flex-1 flex flex-col items-center justify-center text-center" style={{ minHeight: '350px', position: 'relative' }}>
            
            {/* Seletor de Categoria no topo do Card */}
            <div style={{ position: 'absolute', top: '1rem', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
              <select 
                value={categoriaFiltro} 
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                style={{ 
                  background: 'var(--primary)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.25rem 1rem', 
                  borderRadius: '99px', 
                  fontSize: '0.9rem', 
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              >
                <option value="">Modo Aleatório (Todas as Categorias)</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {!perguntaAtual ? (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <h2 style={{ fontSize: '2.2rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
                  Aguardando sorteio...
                </h2>
                <Button onClick={handleSortear} disabled={loadingPergunta} style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}>
                  {loadingPergunta ? 'Sorteando...' : 'Sortear Pergunta'}
                </Button>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '3rem' }}>
                {categoriaFiltro === '' && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Sorteada da categoria: {perguntaAtual.categoria}
                  </span>
                )}
                
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

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <Button onClick={handleSortear} disabled={loadingPergunta} variant="secondary">
                    Sortear Outra (Substituir)
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Botão de Avançar Duelo */}
          <Button 
            onClick={proximoDuelo} 
            style={{ padding: '1.5rem', fontSize: '1.2rem', background: 'var(--accent)', marginTop: '1rem' }}
          >
            {dueloIndex + 1 >= duelos.length ? 'Finalizar Rodada e Avançar' : 'Chamar Próximo Duelo ➔'}
          </Button>

        </div>

        {/* Placar Global (Read-only agora, os botões foram pro duelo) */}
        <div>
          <Card style={{ height: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              Placar Geral
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {turmas.map((turma, index) => {
                // Destacar se a turma estiver no duelo atual
                const isNoDuelo = turma.id === turma1.id || turma.id === turma2.id;
                
                return (
                  <div key={turma.id} style={{ 
                    background: isNoDuelo ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: isNoDuelo ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
