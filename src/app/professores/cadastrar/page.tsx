"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import Link from 'next/link';

export default function CadastrarPerguntaPage() {
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');

  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');

  const [nomeProfessor, setNomeProfessor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Busca categorias existentes
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        const categorias = Array.isArray(data) ? data : [];
        setCategoriasExistentes(categorias);
        if (categorias.length > 0) setCategoriaSelecionada(categorias[0]);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pergunta.trim() || !resposta.trim()) return;

    const categoriaFinal = categoriaSelecionada === 'NOVA' ? novaCategoria.trim() : categoriaSelecionada;
    if (!categoriaFinal) {
      alert("Por favor, selecione ou digite uma categoria.");
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta,
          resposta,
          categoria: categoriaFinal,
          nomeProfessor
        })
      });
      alert('Pergunta cadastrada com sucesso!');
      setPergunta('');
      setResposta('');
      if (categoriaSelecionada === 'NOVA') {
        setCategoriasExistentes([...categoriasExistentes, categoriaFinal].sort());
        setCategoriaSelecionada(categoriaFinal);
        setNovaCategoria('');
      }
    } catch (err) {
      alert('Erro ao cadastrar pergunta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1>Cadastrar Pergunta</h1>
        <Link href="/professores">
          <Button variant="secondary">Voltar</Button>
        </Link>
      </div>

      <Card>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Cadastre novas perguntas para o jogo. Elas serão sorteadas aleatoriamente durante a partida.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Sua Pergunta *</label>
            <textarea
              rows={3}
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              placeholder="Ex: Qual é a capital do Brasil?"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Resposta Correta *</label>
            <input
              type="text"
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Ex: Brasília"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Disciplina/Categoria *</label>
              <select
                value={categoriaSelecionada}
                onChange={(e) => setCategoriaSelecionada(e.target.value)}
                required
              >
                {categoriasExistentes.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="NOVA">+ Criar nova categoria...</option>
              </select>

              {categoriaSelecionada === 'NOVA' && (
                <input
                  type="text"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  placeholder="Nome da nova categoria"
                  required
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Seu Nome (Opcional)</label>
              <input
                type="text"
                value={nomeProfessor}
                onChange={(e) => setNomeProfessor(e.target.value)}
                placeholder="Ex: Prof. Silva"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} style={{ background: 'var(--success)' }}>
            {loading ? 'Salvando...' : 'Salvar Pergunta'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
