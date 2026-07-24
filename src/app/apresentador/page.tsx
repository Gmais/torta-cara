"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card/Card';

interface Pergunta {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
}

export default function ApresentadorPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(senhaInput) === new Date().getDate()) {
      setAutenticado(true);
    } else {
      alert("Senha incorreta!");
      setSenhaInput('');
    }
  };

  useEffect(() => {
    if (!autenticado) return;

    const fetchState = async () => {
      try {
        const res = await fetch('/api/presenter');
        const data = await res.json();
        setPergunta(data.pergunta || null);
      } catch (error) {
        console.error("Erro ao buscar estado", error);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 2000); // Polling a cada 2 segundos
    return () => clearInterval(interval);
  }, [autenticado]);

  if (!autenticado) {
    return (
      <div className="p-8 max-w-md mx-auto animate-fade-in flex flex-col justify-center min-h-screen">
        <Card style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Painel do Apresentador</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Digite a senha do dia para acessar.</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password" 
              value={senhaInput} 
              onChange={e => setSenhaInput(e.target.value)} 
              placeholder="Senha..."
              required
              style={{ padding: '1rem', fontSize: '1.2rem', textAlign: 'center' }}
            />
            <button type="submit" style={{ padding: '1rem', fontSize: '1.1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Entrar</button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-lg">
        <h1 className="text-center mb-6 text-2xl">Painel do Apresentador</h1>
        
        {!pergunta ? (
          <Card style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ opacity: 0.5, fontSize: '4rem', marginBottom: '1rem' }}>⏱</div>
            <h2 style={{ color: 'var(--text-muted)' }}>Aguardando sorteio...</h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Assim que uma pergunta aparecer na tela principal, ela aparecerá aqui com a resposta!
            </p>
          </Card>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card style={{ borderLeft: '4px solid var(--primary)', padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Categoria: {pergunta.categoria}
              </span>
              <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
                {pergunta.pergunta}
              </h2>
            </Card>

            <Card style={{ borderLeft: '4px solid var(--success)', padding: '1.5rem', background: 'rgba(34, 197, 94, 0.1)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Resposta Correta
              </span>
              <h2 style={{ fontSize: '2rem', marginTop: '0.5rem', color: 'var(--success)' }}>
                {pergunta.resposta}
              </h2>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
