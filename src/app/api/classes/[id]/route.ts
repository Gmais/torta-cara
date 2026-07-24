import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    const updatedClass = await prisma.turma.update({
      where: { id: resolvedParams.id },
      data: {
        pontuacao: data.pontuacao,
      }
    });
    return NextResponse.json(updatedClass);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar turma' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.turma.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir turma' }, { status: 500 });
  }
}
