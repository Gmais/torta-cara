"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { useParams } from 'next/navigation';

export default function InscricaoPage() {
  const params = useParams();
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [inscrito, setInscrito] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    
    setLoading(true);
    try {
      await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          turmaId: params.id
        })
      });
      setInscrito(true);
    } catch (err) {
      alert('Erro ao realizar inscrição.');
    } finally {
      setLoading(false);
    }
  };

  if (inscrito) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center animate-fade-in flex flex-col items-center justify-center min-h-screen">
        <Card>
          <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'var(--success)', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '2.5rem' }}>
              Inscrição Confirmada!
            </h1>
            <p style={{ marginTop: '1rem', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
              Boa sorte no Torta na Cara!
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto animate-fade-in flex flex-col justify-center min-h-screen">
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2>Inscrição para o Jogo</h2>
          <p style={{ color: 'var(--text-muted)' }}>Digite seu nome para participar da equipe da sua turma.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Seu Nome</label>
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome completo..."
              required
              style={{ fontSize: '1.1rem', padding: '1rem' }}
            />
          </div>

          <Button type="submit" disabled={loading} style={{ padding: '1rem', fontSize: '1.1rem' }}>
            {loading ? 'Inscrevendo...' : 'Confirmar Inscrição'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
