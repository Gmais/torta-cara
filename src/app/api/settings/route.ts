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
    
    // Filtra apenas os campos permitidos
    const updateData: any = {};
    if (data.pontosPorRodada !== undefined) updateData.pontosPorRodada = data.pontosPorRodada;
    if (data.perguntaAtualId !== undefined) updateData.perguntaAtualId = data.perguntaAtualId;

    await prisma.configuracao.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: { id: 'singleton', ...updateData }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
  }
}
