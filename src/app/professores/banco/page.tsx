"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import Link from 'next/link';

interface Pergunta {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
  dificuldades: string[];
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

export default function BancoDePerguntasPage() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [listaCategorias, setListaCategorias] = useState<string[]>([]);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<string[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerguntas = async () => {
    const res = await fetch('/api/questions');
    const data = await res.json();
    setPerguntas(Array.isArray(data) ? data : []);
  };

  const fetchCategorias = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setListaCategorias(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    Promise.all([fetchPerguntas(), fetchCategorias()]).finally(() => setLoading(false));
  }, []);

  const toggleCategoria = (nome: string) => {
    setCategoriasExpandidas(prev =>
      prev.includes(nome) ? prev.filter(c => c !== nome) : [...prev, nome]
    );
  };

  const toggleSelecionada = (id: string) => {
    setSelecionadas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelecionarCategoria = (catPerguntas: Pergunta[]) => {
    const idsCategoria = catPerguntas.map(p => p.id);
    const todasSelecionadas = idsCategoria.every(id => selecionadas.has(id));
    setSelecionadas(prev => {
      const next = new Set(prev);
      if (todasSelecionadas) {
        idsCategoria.forEach(id => next.delete(id));
      } else {
        idsCategoria.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const iniciarEdicao = (p: Pergunta) => {
    setEditingId(p.id);
    setEditDraft({
      pergunta: p.pergunta,
      resposta: p.resposta,
      categoria: p.categoria,
      dificuldades: p.dificuldades || [],
    });
  };

  const cancelarEdicao = () => {
    setEditingId(null);
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

  const salvarEdicao = async (id: string) => {
    if (!editDraft) return;
    if (!editDraft.pergunta.trim() || !editDraft.resposta.trim()) {
      alert('Pergunta e resposta não podem ficar em branco.');
      return;
    }

    const nome = prompt('Digite seu nome para confirmar a edição desta pergunta:');
    if (!nome || !nome.trim()) {
      alert('É necessário informar seu nome para salvar a edição.');
      return;
    }

    const res = await fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editDraft, editadoPor: nome.trim() })
    });

    if (!res.ok) {
      alert('Erro ao salvar a edição.');
      return;
    }

    setPerguntas(prev => prev.map(p => p.id === id ? { ...p, ...editDraft } : p));
    setEditingId(null);
    setEditDraft(null);
  };

  const excluirPergunta = async (p: Pergunta) => {
    const nome = prompt(`Digite seu nome para confirmar a exclusão desta pergunta:\n\n"${p.pergunta}"`);
    if (!nome || !nome.trim()) {
      alert('É necessário informar seu nome para excluir.');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir esta pergunta? Essa ação não pode ser desfeita.')) return;

    const res = await fetch(`/api/questions/${p.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excluidoPor: nome.trim() })
    });

    if (!res.ok) {
      alert('Erro ao excluir a pergunta.');
      return;
    }

    setPerguntas(prev => prev.filter(q => q.id !== p.id));
    setSelecionadas(prev => {
      const next = new Set(prev);
      next.delete(p.id);
      return next;
    });
  };

  const excluirSelecionadas = async () => {
    if (selecionadas.size === 0) return;

    const nome = prompt(`Digite seu nome para confirmar a exclusão de ${selecionadas.size} pergunta(s) selecionada(s):`);
    if (!nome || !nome.trim()) {
      alert('É necessário informar seu nome para excluir.');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir ${selecionadas.size} pergunta(s) selecionada(s)? Essa ação não pode ser desfeita.`)) return;

    const ids = Array.from(selecionadas);
    const res = await fetch('/api/questions/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, excluidoPor: nome.trim() })
    });

    if (!res.ok) {
      alert('Erro ao excluir as perguntas selecionadas.');
      return;
    }

    setPerguntas(prev => prev.filter(p => !selecionadas.has(p.id)));
    setSelecionadas(new Set());
  };

  // Agrupando perguntas por categoria
  const categoriasMap = perguntas.reduce((acc, curr) => {
    if (!acc[curr.categoria]) acc[curr.categoria] = [];
    acc[curr.categoria].push(curr);
    return acc;
  }, {} as Record<string, Pergunta[]>);

  const categorias = listaCategorias;

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in pb-16">
      <div className="flex justify-between items-center mb-8">
        <h1>Banco de Perguntas</h1>
        <Link href="/professores">
          <Button variant="secondary">Voltar</Button>
        </Link>
      </div>

      {selecionadas.size > 0 && (
        <Card style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{selecionadas.size} pergunta(s) selecionada(s)</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setSelecionadas(new Set())}>Limpar seleção</Button>
            <Button onClick={excluirSelecionadas} style={{ background: 'var(--error)' }}>Excluir selecionadas</Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {categorias.map(cat => {
          const catPerguntas = categoriasMap[cat] || [];
          const isExpanded = categoriasExpandidas.includes(cat);
          const todasSelecionadas = catPerguntas.length > 0 && catPerguntas.every(p => selecionadas.has(p.id));

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
                {catPerguntas.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={todasSelecionadas}
                      onChange={() => toggleSelecionarCategoria(catPerguntas)}
                    />
                    Selecionar todas
                  </label>
                )}
              </div>

              {isExpanded && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {catPerguntas.map(p => {
                    const emEdicao = editingId === p.id && editDraft;

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
                            <Button onClick={() => salvarEdicao(p.id)} style={{ background: 'var(--success)' }}>Salvar</Button>
                            <Button variant="secondary" onClick={cancelarEdicao}>Cancelar</Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={p.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={selecionadas.has(p.id)}
                          onChange={() => toggleSelecionada(p.id)}
                          style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{p.pergunta}</p>
                          <p style={{ color: 'var(--success)' }}>R: {p.resposta}</p>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            {(p.dificuldades || []).map(nivel => (
                              <span key={nivel} style={{ fontSize: '0.85rem', color: NIVEL_COR[nivel] || 'var(--text-muted)' }}>
                                {NIVEL_LABEL[nivel] || nivel}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                          <Button variant="secondary" onClick={() => iniciarEdicao(p)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                            Editar
                          </Button>
                          <Button onClick={() => excluirPergunta(p)} style={{ background: 'var(--error)', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
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
