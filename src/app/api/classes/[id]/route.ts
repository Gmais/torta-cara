import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    
    const updateData: any = {};
    if (data.pontuacao !== undefined) updateData.pontuacao = data.pontuacao;
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.competicaoId !== undefined) {
      updateData.competicaoId = data.competicaoId === '' ? null : data.competicaoId;
    }

    const updatedClass = await prisma.turma.update({
      where: { id: resolvedParams.id },
      data: updateData
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
