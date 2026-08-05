"use client";

import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import Link from 'next/link';
import { FaPlus, FaDatabase } from 'react-icons/fa';

export default function ProfessoresPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="mb-6">Área do Professor</h1>
      <p className="text-xl text-muted mb-12" style={{ color: 'var(--text-muted)' }}>
        O que você deseja fazer?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%' }}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <FaPlus size={48} color="var(--success)" />
            <h2>Cadastrar Nova Pergunta</h2>
            <p style={{ color: 'var(--text-muted)' }}>Adicione novas perguntas ao banco de dados do jogo.</p>
            <Link href="/professores/cadastrar" style={{ width: '100%' }}>
              <Button style={{ width: '100%', background: 'var(--success)' }}>Cadastrar Pergunta</Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <FaDatabase size={48} color="var(--secondary)" />
            <h2>Banco de Perguntas</h2>
            <p style={{ color: 'var(--text-muted)' }}>Consulte, edite ou exclua perguntas já cadastradas.</p>
            <Link href="/professores/banco" style={{ width: '100%' }}>
              <Button variant="secondary" style={{ width: '100%' }}>Acessar Banco</Button>
            </Link>
          </div>
        </Card>
      </div>

      <Link href="/" style={{ marginTop: '3rem' }}>
        <Button variant="secondary">Voltar ao Início</Button>
      </Link>
    </div>
  );
}
