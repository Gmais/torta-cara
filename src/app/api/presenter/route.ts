import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await prisma.configuracao.findUnique({
      where: { id: 'singleton' }
    });

    if (!config || !config.perguntaAtualId) {
      return NextResponse.json({ pergunta: null });
    }

    const pergunta = await prisma.pergunta.findUnique({
      where: { id: config.perguntaAtualId }
    });

    return NextResponse.json({ pergunta });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar estado do apresentador' }, { status: 500 });
  }
}
