"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import Link from 'next/link';

interface Turma {
  id: string;
  nome: string;
  pontuacao: number;
  competicao?: { id: string; nome: string };
  alunos: { id: string; nome: string }[];
}

interface Competicao {
  id: string;
  nome: string;
}

interface Pergunta {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  dificuldades: string[];
}

const NIVEIS_DIFICULDADE = ['Facil', 'Moderado', 'Dificil'] as const;
const NIVEL_LABEL: Record<string, string> = { Facil: 'Fácil', Moderado: 'Moderado', Dificil: 'Difícil' };

interface Duelo {
  t1: Turma;
  t2: Turma;
}

export default function JogoPage() {
  const [todasTurmas, setTodasTurmas] = useState<Turma[]>([]);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [competicaoAtiva, setCompeticaoAtiva] = useState<Competicao | null>(null);
  
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [duelos, setDuelos] = useState<Duelo[]>([]);
  
  // Estados do Jogo (Persistidos no localStorage)
  const [rodada, setRodada] = useState(1);
  const [dueloIndex, setDueloIndex] = useState(0);
  const [pontosValendo, setPontosValendo] = useState(10);
  const [historico, setHistorico] = useState<any[]>([]);
  const [alunosSorteados, setAlunosSorteados] = useState<Record<string, Record<string, number>>>({});
  
  // Estado Local (Não persistido)
  const [representanteT1, setRepresentanteT1] = useState<string | null>(null);
  const [representanteT2, setRepresentanteT2] = useState<string | null>(null);
  
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta | null>(null);
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPergunta, setLoadingPergunta] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Categorias para o filtro
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>(''); // '' = Aleatório
  const [dificuldadeFiltro, setDificuldadeFiltro] = useState<string>(''); // '' = Aleatório

  // Carrega dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      const resClasses = await fetch('/api/classes');
      const classes = await resClasses.json();
      setTodasTurmas(classes);

      const resCat = await fetch('/api/categories');
      const cats = await resCat.json();
      setCategorias(cats);
      
      const resComp = await fetch('/api/competitions');
      const comps = await resComp.json();
      setCompeticoes(comps);

      // Recupera estado salvo
      const savedState = localStorage.getItem('torta_cara_gameState');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setRodada(parsed.rodada || 1);
          setPontosValendo(parsed.pontosValendo || 10);
          if (parsed.historico) setHistorico(parsed.historico);
          if (parsed.alunosSorteados) setAlunosSorteados(parsed.alunosSorteados);
          
          if (parsed.competicaoAtiva) {
            setupGameForCompetition(classes, parsed.competicaoAtiva, parsed.dueloIndex || 0);
          }
        } catch(e) {}
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const setupGameForCompetition = (allClasses: Turma[], comp: Competicao, savedDueloIndex: number = 0) => {
    const turmasFiltradas = allClasses.filter(t => t.competicao?.id === comp.id);
    setTurmas(turmasFiltradas.sort((a,b) => b.pontuacao - a.pontuacao));
    
    const novosDuelos: Duelo[] = [];
    for (let i = 0; i < turmasFiltradas.length; i++) {
      for (let j = i + 1; j < turmasFiltradas.length; j++) {
        novosDuelos.push({ t1: turmasFiltradas[i], t2: turmasFiltradas[j] });
      }
    }
    setDuelos(novosDuelos);
    setDueloIndex(savedDueloIndex < novosDuelos.length ? savedDueloIndex : 0);
    setCompeticaoAtiva(comp);
  };

  // Salva o estado sempre que mudar
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('torta_cara_gameState', JSON.stringify({
        rodada,
        dueloIndex,
        pontosValendo,
        historico,
        competicaoAtiva,
        alunosSorteados
      }));
    }
  }, [rodada, dueloIndex, pontosValendo, historico, competicaoAtiva, alunosSorteados, loading]);

  const sortearAluno = (turma: Turma, setRepresentante: (nome: string) => void) => {
    if (!turma.alunos || turma.alunos.length === 0) {
      alert(`A turma ${turma.nome} não tem alunos cadastrados!`);
      return;
    }

    // Sorteia sempre entre quem tem a MENOR quantidade de sorteios até agora.
    // Um aluno só pode ser sorteado uma vez a mais (2ª, 3ª... vez) depois que
    // todos os demais da equipe já tiverem alcançado essa mesma quantidade.
    const contagem = alunosSorteados[turma.id] || {};
    const menorContagem = Math.min(...turma.alunos.map(a => contagem[a.id] ?? 0));
    const elegiveis = turma.alunos.filter(a => (contagem[a.id] ?? 0) === menorContagem);

    const sorteado = elegiveis[Math.floor(Math.random() * elegiveis.length)];
    setRepresentante(sorteado.nome);

    setAlunosSorteados(prev => {
      const contagemAtual = prev[turma.id] || {};
      return {
        ...prev,
        [turma.id]: {
          ...contagemAtual,
          [sorteado.id]: (contagemAtual[sorteado.id] ?? 0) + 1
        }
      };
    });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleSortear = async () => {
    setLoadingPergunta(true);
    setMostrarResposta(false);
    try {
      const params = new URLSearchParams({ random: 'true' });
      if (categoriaFiltro) params.set('categoria', categoriaFiltro);
      if (dificuldadeFiltro) params.set('dificuldade', dificuldadeFiltro);
      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      if (data && data.id) {
        setPerguntaAtual(data);
        
        // Sincroniza com o backend para a tela do apresentador
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ perguntaAtualId: data.id })
        });
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
    if (isTransitioning) return;
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;
    
    setIsTransitioning(true);
    
    const dueloAtual = duelos[dueloIndex];
    const isT1 = dueloAtual.t1.id === turmaId;
    const turmaAdvId = isT1 ? dueloAtual.t2.id : dueloAtual.t1.id;
    const turmaAdv = turmas.find(t => t.id === turmaAdvId);

    // Acerto: a própria equipe leva os pontos cheios da rodada.
    // Erro: a equipe adversária leva os pontos cheios da rodada (quem errou não perde nada).
    const turmaGanhadora = operacao === 'add' ? turma : turmaAdv;

    const changes: { turmaId: string, delta: number }[] = [];
    const novaPontuacao = turmaGanhadora ? turmaGanhadora.pontuacao + pontosValendo : 0;
    if (turmaGanhadora) changes.push({ turmaId: turmaGanhadora.id, delta: pontosValendo });

    // Salva no histórico para poder desfazer
    setHistorico(prev => [...prev, { changes }]);

    if (turmaGanhadora) {
      // Atualiza otimista (Reflete na tabela de duelos e no placar lateral)
      setTurmas(prev => prev
        .map(t => t.id === turmaGanhadora.id ? { ...t, pontuacao: novaPontuacao } : t)
        .sort((a, b) => b.pontuacao - a.pontuacao));

      setDuelos(prev => prev.map(d => ({
        t1: d.t1.id === turmaGanhadora.id ? { ...d.t1, pontuacao: novaPontuacao } : d.t1,
        t2: d.t2.id === turmaGanhadora.id ? { ...d.t2, pontuacao: novaPontuacao } : d.t2,
      })));

      await fetch(`/api/classes/${turmaGanhadora.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pontuacao: novaPontuacao })
      });
    }

    // Passa automaticamente para o próximo duelo após 1.5 segundos
    setTimeout(() => {
      proximoDuelo();
      setIsTransitioning(false);
    }, 1500);
  };

  const proximoDuelo = async () => {
    setPerguntaAtual(null);
    setMostrarResposta(false);
    setRepresentanteT1(null);
    setRepresentanteT2(null);
    
    // Limpa a pergunta na API do apresentador
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perguntaAtualId: null })
    });
    
    if (dueloIndex + 1 >= duelos.length) {
      // Fim da rodada, volta pro primeiro duelo e aumenta o contador de rodadas
      setDueloIndex(0);
      setRodada(r => r + 1);
    } else {
      setDueloIndex(i => i + 1);
    }
  };

  const dueloAnterior = async () => {
    setPerguntaAtual(null);
    setMostrarResposta(false);
    setRepresentanteT1(null);
    setRepresentanteT2(null);
    
    // Limpa a pergunta na API do apresentador
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perguntaAtualId: null })
    });
    
    // Desfaz a pontuação do duelo anterior
    if (historico.length > 0) {
      const lastAction = historico[historico.length - 1];
      
      const changesToUndo: { turmaId: string, delta: number }[] = lastAction.changes 
        ? lastAction.changes // Novo formato
        : [{ turmaId: lastAction.turmaId, delta: lastAction.delta }]; // Formato antigo
        
      if (changesToUndo.length > 0) {
        let newTurmas = [...turmas];
        let newDuelos = [...duelos];
        
        for (const change of changesToUndo) {
          const turma = newTurmas.find(t => t.id === change.turmaId);
          if (turma) {
            const pontuacaoRestaurada = Math.max(0, turma.pontuacao - change.delta);
            
            newTurmas = newTurmas.map(t => t.id === turma.id ? { ...t, pontuacao: pontuacaoRestaurada } : t);
            newDuelos = newDuelos.map(d => ({
              t1: d.t1.id === turma.id ? { ...d.t1, pontuacao: pontuacaoRestaurada } : d.t1,
              t2: d.t2.id === turma.id ? { ...d.t2, pontuacao: pontuacaoRestaurada } : d.t2,
            }));
            
            // Atualiza API em background
            fetch(`/api/classes/${turma.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pontuacao: pontuacaoRestaurada })
            });
          }
        }
        
        setTurmas(newTurmas.sort((a,b) => b.pontuacao - a.pontuacao));
        setDuelos(newDuelos);
      }
      
      // Remove do histórico
      setHistorico(prev => prev.slice(0, -1));
    }
    
    // Retrocede o índice
    if (dueloIndex > 0) {
      setDueloIndex(i => i - 1);
    } else if (rodada > 1) {
      setRodada(r => r - 1);
      setDueloIndex(duelos.length - 1);
    }
  };

  const handleReset = async () => {
    if (confirm("Tem certeza que deseja zerar a pontuação de todas as equipes? O jogo e os duelos também voltarão para o início.")) {
      // Atualiza estado local
      setTurmas(prev => prev.map(t => ({ ...t, pontuacao: 0 })));
      setDuelos(prev => prev.map(d => ({
        t1: { ...d.t1, pontuacao: 0 },
        t2: { ...d.t2, pontuacao: 0 },
      })));
      setRodada(1);
      setDueloIndex(0);
      setHistorico([]);
      setAlunosSorteados({});
      setPerguntaAtual(null);
      setMostrarResposta(false);
      setRepresentanteT1(null);
      setRepresentanteT2(null);
      
      // Limpa a pergunta na API do apresentador
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perguntaAtualId: null })
      });
      
      // Atualiza banco de dados
      await Promise.all(turmas.map(t => fetch(`/api/classes/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pontuacao: 0 })
      })));
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando Jogo...</div>;

  if (!competicaoAtiva) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center animate-fade-in flex flex-col items-center justify-center min-h-screen">
        <h1 className="mb-8 text-4xl">Selecione a Competição</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {competicoes.map(comp => (
             <Card 
               key={comp.id} 
               onClick={() => setupGameForCompetition(todasTurmas, comp)}
               style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }}
               onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
               onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
             >
               <h2>{comp.nome}</h2>
               <p style={{ color: 'var(--text-muted)' }}>{todasTurmas.filter(t => t.competicao?.id === comp.id).length} turmas cadastradas</p>
             </Card>
          ))}
          {competicoes.length === 0 && (
            <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>Nenhuma competição cadastrada. Vá ao painel admin.</p>
          )}
        </div>
        <Link href="/" style={{ marginTop: '2rem', display: 'inline-block' }}>
          <Button variant="secondary">Voltar ao Início</Button>
        </Link>
      </div>
    );
  }

  if (turmas.length < 2) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen animate-fade-in">
        <h2>Você precisa cadastrar pelo menos 2 turmas nesta competição para iniciar o jogo.</h2>
        <Button className="mt-4" onClick={() => setCompeticaoAtiva(null)}>Escolher Outra Competição</Button>
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
          <Button variant="secondary" onClick={toggleFullScreen}>
            {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          </Button>
          <Button variant="secondary" onClick={() => setCompeticaoAtiva(null)}>Trocar Competição</Button>
          <Link href="/">
            <Button variant="secondary">Sair</Button>
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
              <div style={{ flex: 1, textAlign: 'center', opacity: isTransitioning ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                <div 
                  onClick={() => sortearAluno(turma1, setRepresentanteT1)} 
                  style={{ cursor: 'pointer', display: 'inline-block', transition: 'all 0.2s', padding: '1rem', borderRadius: '8px' }}
                  title="Clique para sortear representante"
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <h2 style={{ margin: 0, fontSize: '2.5rem' }}>{turma1.nome}</h2>
                  {representanteT1 && (
                    <div className="animate-fade-in" style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                      👤 {representanteT1}
                    </div>
                  )}
                  {!representanteT1 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.5rem' }}>Toque para sortear</p>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <Button onClick={() => handlePontuar(turma1.id, 'add')} disabled={isTransitioning} style={{ background: 'var(--success)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>+ Acertou</Button>
                  <Button onClick={() => handlePontuar(turma1.id, 'sub')} disabled={isTransitioning} style={{ background: 'var(--error)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>- Errou</Button>
                </div>
              </div>

              {/* VS */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 1rem', opacity: isTransitioning ? 0.5 : 1 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold', marginBottom: '-0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '99px' }}>
                  Rodada {rodada} | Duelo {dueloIndex + 1} de {duelos.length}
                </span>
                <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--accent)', fontStyle: 'italic' }}>
                  VS
                </div>
              </div>

              {/* Equipe 2 */}
              <div style={{ flex: 1, textAlign: 'center', opacity: isTransitioning ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                <div 
                  onClick={() => sortearAluno(turma2, setRepresentanteT2)} 
                  style={{ cursor: 'pointer', display: 'inline-block', transition: 'all 0.2s', padding: '1rem', borderRadius: '8px' }}
                  title="Clique para sortear representante"
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <h2 style={{ margin: 0, fontSize: '2.5rem' }}>{turma2.nome}</h2>
                  {representanteT2 && (
                    <div className="animate-fade-in" style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                      👤 {representanteT2}
                    </div>
                  )}
                  {!representanteT2 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.5rem' }}>Toque para sortear</p>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <Button onClick={() => handlePontuar(turma2.id, 'add')} disabled={isTransitioning} style={{ background: 'var(--success)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>+ Acertou</Button>
                  <Button onClick={() => handlePontuar(turma2.id, 'sub')} disabled={isTransitioning} style={{ background: 'var(--error)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>- Errou</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Box da Pergunta */}
          <Card className="flex-1 flex flex-col items-center justify-center text-center" style={{ minHeight: '350px', position: 'relative' }}>
            
            {/* Seletores de Categoria e Dificuldade no topo do Card */}
            <div style={{ position: 'absolute', top: '1rem', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0 1rem' }}>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                style={{
                  width: 'auto',
                  maxWidth: '260px',
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

              <select
                value={dificuldadeFiltro}
                onChange={(e) => setDificuldadeFiltro(e.target.value)}
                style={{
                  width: 'auto',
                  maxWidth: '220px',
                  background: 'var(--secondary)',
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
                <option value="">Aleatório (Todos os Níveis)</option>
                {NIVEIS_DIFICULDADE.map(n => <option key={n} value={n}>{NIVEL_LABEL[n]}</option>)}
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

          {/* Botões de Navegação dos Duelos */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
            <Button 
              onClick={dueloAnterior} 
              variant="secondary"
              style={{ padding: '1.5rem', fontSize: '1.2rem', minWidth: '300px' }}
              disabled={rodada === 1 && dueloIndex === 0}
            >
              ⬅ Voltar ao Duelo Anterior (Desfazer)
            </Button>
          </div>

        </div>

        {/* Placar Global */}
        <div>
          <Card style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
              <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Placar Geral</h2>
              <button 
                onClick={handleReset} 
                style={{ 
                  background: 'none', 
                  border: '1px solid rgba(244, 63, 94, 0.5)', 
                  color: 'var(--error)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '99px', 
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                Resetar Partida
              </button>
            </div>
            
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
