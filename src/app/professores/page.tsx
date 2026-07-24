"use client";

import { useState } from 'react';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import Link from 'next/link';

export default function ProfessoresPage() {
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const [categoria, setCategoria] = useState('EF');
  const [nomeProfessor, setNomeProfessor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pergunta.trim() || !resposta.trim()) return;
    
    setLoading(true);
    try {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta,
          resposta,
          categoria,
          nomeProfessor
        })
      });
      alert('Pergunta cadastrada com sucesso!');
      setPergunta('');
      setResposta('');
    } catch (err) {
      alert('Erro ao cadastrar pergunta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1>Área do Professor</h1>
        <Link href="/">
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Público Alvo *</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="EF">Ensino Fundamental (EF)</option>
                <option value="EM">Ensino Médio (EM)</option>
                <option value="Geral">Geral (Ambos)</option>
              </select>
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
