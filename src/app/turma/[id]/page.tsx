"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { useParams } from 'next/navigation';

interface Participante {
  id: string;
  nome: string;
}

export default function InscricaoPage() {
  const params = useParams();
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  const fetchParticipantes = async () => {
    try {
      const res = await fetch(`/api/participants?turmaId=${params.id}`);
      const data = await res.json();
      setParticipantes(data);
    } catch (err) {}
    setLoadingList(false);
  };

  useEffect(() => {
    fetchParticipantes();
  }, [params.id]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    
    setLoading(true);
    try {
      if (editandoId) {
        await fetch(`/api/participants/${editandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome })
        });
      } else {
        await fetch('/api/participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            turmaId: params.id
          })
        });
      }
      setNome('');
      setEditandoId(null);
      fetchParticipantes();
    } catch (err) {
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Participante) => {
    setEditandoId(p.id);
    setNome(p.nome);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este participante?')) return;
    await fetch(`/api/participants/${id}`, { method: 'DELETE' });
    fetchParticipantes();
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setNome('');
  };

  return (
    <div className="p-8 max-w-md mx-auto animate-fade-in flex flex-col justify-center min-h-screen">
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2>{editandoId ? 'Editar Inscrito' : 'Inscrição para o Jogo'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{editandoId ? 'Modifique o nome do participante.' : 'Cadastre os membros da equipe.'}</p>
        </div>

        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nome do Participante</label>
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome..."
              required
              style={{ fontSize: '1.1rem', padding: '1rem', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button type="submit" disabled={loading} style={{ padding: '1rem', fontSize: '1.1rem', flex: 1, background: editandoId ? 'var(--accent)' : 'var(--primary)' }}>
              {loading ? 'Salvando...' : (editandoId ? 'Salvar Alterações' : 'Adicionar Participante')}
            </Button>
            {editandoId && (
              <Button type="button" variant="secondary" onClick={handleCancelar} style={{ padding: '1rem', fontSize: '1.1rem' }}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h3 style={{ marginBottom: '1.5rem' }}>Inscritos nesta Turma ({participantes.length})</h3>
        
        {loadingList ? (
          <p style={{ color: 'var(--text-muted)' }}>Carregando lista...</p>
        ) : participantes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum participante inscrito ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {participantes.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <span style={{ fontWeight: 500 }}>{p.nome}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" onClick={() => handleEdit(p)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Editar</Button>
                  <Button onClick={() => handleDelete(p.id)} style={{ background: 'var(--error)', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Excluir</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
