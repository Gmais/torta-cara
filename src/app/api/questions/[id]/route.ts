import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    
    const updatedQuestion = await prisma.pergunta.update({
      where: { id: resolvedParams.id },
      data: {
        pergunta: data.pergunta,
        resposta: data.resposta,
        categoria: data.categoria,
      }
    });
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar pergunta' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.pergunta.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir pergunta' }, { status: 500 });
  }
}
