import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.configuracao.findUnique({
      where: { id: 'singleton' }
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const settings = await prisma.configuracao.upsert({
      where: { id: 'singleton' },
      update: { pontosPorRodada: data.pontosPorRodada },
      create: { id: 'singleton', pontosPorRodada: data.pontosPorRodada },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
  }
}
