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
  competicao?: { id: string; nome: string };
}

interface Competicao {
  id: string;
  nome: string;
  turmas: { id: string; nome: string }[];
}

interface Pergunta {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  dificuldades: string[];
  destaque: boolean;
  conferido: boolean;
}

function precisaConferencia(p: Pergunta): boolean {
  return (p.categoria === 'Diversos/Geral' || p.destaque) && !p.conferido;
}

interface EditDraft {
  pergunta: string;
  resposta: string;
  categoria: string;
  dificuldades: string[];
}

const NIVEIS_DIFICULDADE = ['Facil', 'Moderado', 'Dificil'] as const;
const NIVEL_LABEL: Record<string, string> = { Facil: 'Fácil', Moderado: 'Moderado', Dificil: 'Difícil' };
const NIVEL_COR: Record<string, string> = { Facil: 'var(--success)', Moderado: '#f59e0b', Dificil: 'var(--error)' };
const COR_DESTAQUE = '#facc15';

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [listaCategorias, setListaCategorias] = useState<string[]>([]);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  
  const [novaTurma, setNovaTurma] = useState('');
  const [editandoTurmaId, setEditandoTurmaId] = useState<string | null>(null);
  const [novaCompeticao, setNovaCompeticao] = useState('');
  const [competicaoSelecionada, setCompeticaoSelecionada] = useState('');
  const [pontosPorRodada, setPontosPorRodada] = useState(10);
  const [loading, setLoading] = useState(true);

  // Controle de estado para as categorias expandidas
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<string[]>([]);
  const [editandoPerguntaId, setEditandoPerguntaId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  const fetchTurmas = async () => {
    const res = await fetch('/api/classes');
    const data = await res.json();
    setTurmas(data);
  };

  const fetchPerguntas = async () => {
    const res = await fetch('/api/questions');
    const data = await res.json();
    setPerguntas(data);
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data) setPontosPorRodada(data.pontosPorRodada);
    setLoading(false);
  };

  const fetchCategorias = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setListaCategorias(data);
  };

  const fetchCompeticoes = async () => {
    const res = await fetch('/api/competitions');
    const data = await res.json();
    setCompeticoes(data);
  };

  useEffect(() => {
    fetchTurmas();
    fetchPerguntas();
    fetchCategorias();
    fetchCompeticoes();
    fetchSettings();
  }, []);

  const handleSalvarTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTurma.trim()) return;
    
    if (editandoTurmaId) {
      await fetch(`/api/classes/${editandoTurmaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novaTurma, competicaoId: competicaoSelecionada || '' })
      });
    } else {
      await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novaTurma, competicaoId: competicaoSelecionada || undefined })
      });
    }
    
    setNovaTurma('');
    setCompeticaoSelecionada('');
    setEditandoTurmaId(null);
    fetchTurmas();
    fetchCompeticoes();
  };

  const iniciarEdicaoTurma = (turma: Turma) => {
    setEditandoTurmaId(turma.id);
    setNovaTurma(turma.nome);
    setCompeticaoSelecionada(turma.competicao?.id || '');
    // Scrolla para o form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const cancelarEdicaoTurma = () => {
    setEditandoTurmaId(null);
    setNovaTurma('');
    setCompeticaoSelecionada('');
  };

  const handleCriarCompeticao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCompeticao.trim()) return;
    await fetch('/api/competitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novaCompeticao })
    });
    setNovaCompeticao('');
    fetchCompeticoes();
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
    fetchCompeticoes();
  };

  const handleDeleteCompeticao = async (id: string) => {
    if (!confirm('Deseja excluir esta competição?')) return;
    await fetch(`/api/competitions/${id}`, { method: 'DELETE' });
    fetchCompeticoes();
    fetchTurmas();
  };

  // Funções de Categorias
  const handleEditCategoria = async (oldName: string) => {
    const newName = prompt(`Novo nome para a categoria "${oldName}":`, oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    
    if (confirm(`Tem certeza? Isso atualizará todas as perguntas da categoria "${oldName}".`)) {
      await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName: newName.trim() })
      });
      fetchPerguntas();
    }
  };

  const handleDeleteCategoria = async (name: string) => {
    if (confirm(`ATENÇÃO! Tem certeza que deseja excluir a categoria "${name}" e TODAS as suas perguntas? Essa ação não pode ser desfeita.`)) {
      await fetch(`/api/categories?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      fetchPerguntas();
      fetchCategorias();
    }
  };

  const handleCriarCategoria = async () => {
    const novaCat = prompt('Digite o nome da nova categoria:');
    if (!novaCat || novaCat.trim() === '') return;
    
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria: novaCat.trim() })
    });
    fetchCategorias();
  };

  const toggleCategoria = (name: string) => {
    setCategoriasExpandidas(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  // Funções de Perguntas
  const iniciarEdicaoPergunta = (pergunta: Pergunta) => {
    setEditandoPerguntaId(pergunta.id);
    setEditDraft({
      pergunta: pergunta.pergunta,
      resposta: pergunta.resposta,
      categoria: pergunta.categoria,
      dificuldades: pergunta.dificuldades || [],
    });
  };

  const cancelarEdicaoPergunta = () => {
    setEditandoPerguntaId(null);
    setEditDraft(null);
  };

  const toggleDificuldadeDraft = (nivel: string) => {
    if (!editDraft) return;
    const atuais = editDraft.dificuldades;
    setEditDraft({
      ...editDraft,
      dificuldades: atuais.includes(nivel) ? atuais.filter(n => n !== nivel) : [...atuais, nivel],
    });
  };

  const salvarEdicaoPergunta = async (id: string) => {
    if (!editDraft) return;
    if (!editDraft.pergunta.trim() || !editDraft.resposta.trim()) {
      alert('Pergunta e resposta não podem ficar em branco.');
      return;
    }

    const res = await fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editDraft, editadoPor: 'Admin' })
    });

    if (!res.ok) {
      alert('Erro ao salvar a edição.');
      return;
    }

    setEditandoPerguntaId(null);
    setEditDraft(null);
    fetchPerguntas();
  };

  const handleToggleDificuldade = async (pergunta: Pergunta, nivel: string) => {
    const atuais = pergunta.dificuldades || [];
    const novaLista = atuais.includes(nivel)
      ? atuais.filter(n => n !== nivel)
      : [...atuais, nivel];

    setPerguntas(prev => prev.map(p => p.id === pergunta.id ? { ...p, dificuldades: novaLista } : p));

    await fetch(`/api/questions/${pergunta.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pergunta, dificuldades: novaLista })
    });
  };

  const handleConferirPergunta = async (id: string) => {
    setPerguntas(prev => prev.map(p => p.id === id ? { ...p, conferido: true } : p));

    await fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conferido: true })
    });
  };

  const handleDeletePergunta = async (id: string) => {
    if (!confirm('Deseja excluir esta pergunta?')) return;

    const res = await fetch(`/api/questions/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excluidoPor: 'Admin' })
    });

    if (!res.ok) {
      alert('Erro ao excluir a pergunta.');
      return;
    }

    fetchPerguntas();
  };

  // Agrupando perguntas por categoria
  const categoriasMap = perguntas.reduce((acc, curr) => {
    if (!acc[curr.categoria]) acc[curr.categoria] = [];
    acc[curr.categoria].push(curr);
    return acc;
  }, {} as Record<string, Pergunta[]>);
  
  // Usa a lista global do banco para exibir até as categorias sem perguntas
  const categorias = listaCategorias;

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(senhaInput) === new Date().getDate()) {
      setAutenticado(true);
    } else {
      alert("Senha incorreta!");
      setSenhaInput('');
    }
  };

  if (!autenticado) {
    return (
      <div className="p-8 max-w-md mx-auto animate-fade-in flex flex-col justify-center min-h-screen">
        <Card style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Acesso Restrito</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Digite a senha do dia para acessar o Painel Admin.</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" 
              value={senhaInput} 
              onChange={e => setSenhaInput(e.target.value)} 
              placeholder="Senha..."
              required
              style={{ padding: '1rem', fontSize: '1.2rem', textAlign: 'center' }}
            />
            <Button type="submit" style={{ padding: '1rem', fontSize: '1.1rem' }}>Entrar</Button>
            <Link href="/">
              <Button type="button" variant="secondary" style={{ width: '100%', marginTop: '0.5rem' }}>Voltar</Button>
            </Link>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in pb-16">
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
          <h2>{editandoTurmaId ? 'Editar Turma' : 'Nova Turma'}</h2>
          <form onSubmit={handleSalvarTurma} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome da Turma</label>
              <input 
                type="text" 
                value={novaTurma} 
                onChange={(e) => setNovaTurma(e.target.value)}
                placeholder="Ex: 3º Ano B"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Competição</label>
              <select value={competicaoSelecionada} onChange={e => setCompeticaoSelecionada(e.target.value)}>
                <option value="">Sem Competição</option>
                {competicoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button type="submit" style={{ flex: 1, background: editandoTurmaId ? 'var(--accent)' : 'var(--primary)' }}>
                {editandoTurmaId ? 'Salvar Alterações' : 'Adicionar Turma'}
              </Button>
              {editandoTurmaId && (
                <Button type="button" variant="secondary" onClick={cancelarEdicaoTurma}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Competições</h2>
      <Card style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleCriarCompeticao} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nova Competição</label>
            <input type="text" value={novaCompeticao} onChange={(e) => setNovaCompeticao(e.target.value)} placeholder="Ex: Fundamental II" />
          </div>
          <Button type="submit" style={{ background: 'var(--success)' }}>Criar</Button>
        </form>
      </Card>
      
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
        {competicoes.map(comp => (
          <Card key={comp.id} className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>{comp.nome}</h3>
              <p style={{ color: 'var(--text-muted)' }}>Turmas: {comp.turmas.map(t => t.nome).join(', ') || 'Nenhuma'}</p>
            </div>
            <Button onClick={() => handleDeleteCompeticao(comp.id)} style={{ background: 'var(--error)' }}>
              Excluir
            </Button>
          </Card>
        ))}
        {competicoes.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhuma competição cadastrada.</p>}
      </div>

      <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Turmas Cadastradas</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {turmas.map(turma => (
          <Card key={turma.id} className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>{turma.nome}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{turma._count.alunos} alunos inscritos | {turma.pontuacao} pontos</p>
              
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>Link de Inscrição:</span> <br/>
                  <a href={`/turma/${turma.id}`} target="_blank" style={{ color: 'var(--secondary)' }}>
                    {typeof window !== 'undefined' ? window.location.origin : ''}/turma/{turma.id}
                  </a>
                </div>
                
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/turma/' + turma.id : '')}&color=255-255-255&bgcolor=15-23-42`}
                  alt={`QR Code ${turma.nome}`}
                  width={64}
                  height={64}
                  style={{ borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => iniciarEdicaoTurma(turma)}>
                Editar
              </Button>
              <Button onClick={() => handleDeleteTurma(turma.id)} style={{ background: 'var(--error)' }}>
                Excluir
              </Button>
            </div>
          </Card>
        ))}
        {turmas.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhuma turma cadastrada.</p>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Banco de Perguntas e Categorias</h2>
        <Button onClick={handleCriarCategoria} style={{ background: 'var(--success)' }}>
          + Nova Categoria
        </Button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {categorias.map(cat => {
          const catPerguntas = [...(categoriasMap[cat] || [])].sort((a, b) => Number(precisaConferencia(b)) - Number(precisaConferencia(a)));
          const isExpanded = categoriasExpandidas.includes(cat);
          
          return (
            <Card key={cat} style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => toggleCategoria(cat)}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isExpanded ? '▼' : '▶'} {cat}
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                      ({catPerguntas.length} perguntas)
                    </span>
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" onClick={() => handleEditCategoria(cat)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Editar
                  </Button>
                  <Button onClick={() => handleDeleteCategoria(cat)} style={{ background: 'var(--error)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Excluir
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {catPerguntas.map(p => {
                    const emEdicao = editandoPerguntaId === p.id && editDraft;
                    const destacada = precisaConferencia(p);

                    if (emEdicao) {
                      return (
                        <div key={p.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Pergunta</label>
                            <textarea
                              rows={2}
                              value={editDraft.pergunta}
                              onChange={(e) => setEditDraft({ ...editDraft, pergunta: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Resposta</label>
                            <input
                              type="text"
                              value={editDraft.resposta}
                              onChange={(e) => setEditDraft({ ...editDraft, resposta: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>Categoria</label>
                            <select
                              value={editDraft.categoria}
                              onChange={(e) => setEditDraft({ ...editDraft, categoria: e.target.value })}
                            >
                              {listaCategorias.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            {NIVEIS_DIFICULDADE.map(nivel => (
                              <label
                                key={nivel}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: NIVEL_COR[nivel], cursor: 'pointer' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={editDraft.dificuldades.includes(nivel)}
                                  onChange={() => toggleDificuldadeDraft(nivel)}
                                  style={{ accentColor: NIVEL_COR[nivel], width: '1rem', height: '1rem', cursor: 'pointer' }}
                                />
                                {NIVEL_LABEL[nivel]}
                              </label>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button onClick={() => salvarEdicaoPergunta(p.id)} style={{ background: 'var(--success)' }}>Salvar</Button>
                            <Button variant="secondary" onClick={cancelarEdicaoPergunta}>Cancelar</Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={p.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1, paddingRight: '1rem' }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: destacada ? COR_DESTAQUE : undefined }}>{p.pergunta}</p>
                          <p style={{ color: 'var(--success)' }}>R: {p.resposta}</p>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {NIVEIS_DIFICULDADE.map(nivel => (
                              <label
                                key={nivel}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: NIVEL_COR[nivel], cursor: 'pointer' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={(p.dificuldades || []).includes(nivel)}
                                  onChange={() => handleToggleDificuldade(p, nivel)}
                                  style={{ accentColor: NIVEL_COR[nivel], width: '1rem', height: '1rem', cursor: 'pointer' }}
                                />
                                {NIVEL_LABEL[nivel]}
                              </label>
                            ))}
                            {destacada && (
                              <label
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: COR_DESTAQUE, cursor: 'pointer' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => handleConferirPergunta(p.id)}
                                  style={{ accentColor: COR_DESTAQUE, width: '1rem', height: '1rem', cursor: 'pointer' }}
                                />
                                Conferido
                              </label>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                          <Button variant="secondary" onClick={() => iniciarEdicaoPergunta(p)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                            Editar
                          </Button>
                          <Button onClick={() => handleDeletePergunta(p.id)} style={{ background: 'var(--error)', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                            Excluir
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
        {categorias.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhuma pergunta cadastrada.</p>}
      </div>
    </div>
  );
}
