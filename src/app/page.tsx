"use client";

import Link from 'next/link';
import { Button } from '@/components/Button/Button';
import { Card } from '@/components/Card/Card';
import { FaPlay, FaChalkboardTeacher, FaUserEdit, FaCogs } from 'react-icons/fa';
import { useEffect, useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  useEffect(() => {
    setUrl(window.location.origin);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="max-w-4xl w-full animate-fade-in">
        <h1 className="mb-6">Torta na Cara</h1>
        <p className="text-xl text-muted mb-12">O jogo de perguntas e respostas definitivo para sua escola.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <FaPlay size={48} color="var(--primary)" />
              <h2>Ir para o Jogo</h2>
              <p style={{ color: 'var(--text-muted)' }}>Inicie a partida ao vivo e divirta-se com as turmas.</p>
              <Link href="/jogo" style={{ width: '100%' }}>
                <Button style={{ width: '100%' }}>Iniciar Partida</Button>
              </Link>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <FaCogs size={48} color="var(--accent)" />
              <h2>Painel Admin</h2>
              <p style={{ color: 'var(--text-muted)' }}>Gerencie turmas, crie links de inscrição e defina pontuações.</p>
              <Link href="/admin" style={{ width: '100%' }}>
                <Button variant="secondary" style={{ width: '100%' }}>Acessar Painel</Button>
              </Link>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <FaChalkboardTeacher size={48} color="var(--success)" />
              <h2>Área do Professor</h2>
              <p style={{ color: 'var(--text-muted)' }}>Cadastre novas perguntas para o banco de dados do jogo.</p>
              <Link href="/professores" style={{ width: '100%' }}>
                <Button style={{ width: '100%', background: 'var(--success)' }}>Cadastrar Perguntas</Button>
              </Link>
              
              {url && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', width: '100%' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Acesso Direto (Celular):</p>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url + '/professores')}&color=255-255-255&bgcolor=15-23-42`} 
                    alt="QR Code Professor" 
                    width={120} 
                    height={120} 
                    style={{ margin: '0 auto', borderRadius: '8px' }} 
                  />
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
