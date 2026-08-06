import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const resolvedParams = await params;

    // Só registramos editadoPor/editadoEm quando a edição vem acompanhada do nome
    // (fluxo do Banco de Perguntas do professor). Outras chamadas, como o toggle
    // de dificuldade no admin, continuam funcionando sem exigir isso.
    const editadoPor = typeof data.editadoPor === 'string' ? data.editadoPor.trim() : '';

    const updatedQuestion = await prisma.pergunta.update({
      where: { id: resolvedParams.id },
      data: {
        pergunta: data.pergunta,
        resposta: data.resposta,
        categoria: data.categoria,
        dificuldades: data.dificuldades,
        ...(editadoPor ? { editadoPor, editadoEm: new Date() } : {}),
        ...(typeof data.conferido === 'boolean' ? { conferido: data.conferido } : {}),
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
    const body = await request.json().catch(() => ({}));
    const excluidoPor = typeof body.excluidoPor === 'string' ? body.excluidoPor.trim() : '';

    if (!excluidoPor) {
      return NextResponse.json({ error: 'Nome de quem está excluindo é obrigatório' }, { status: 400 });
    }

    const pergunta = await prisma.pergunta.findUnique({ where: { id: resolvedParams.id } });
    if (!pergunta) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 });
    }

    await prisma.perguntaExcluida.create({
      data: {
        perguntaId: pergunta.id,
        pergunta: pergunta.pergunta,
        resposta: pergunta.resposta,
        categoria: pergunta.categoria,
        excluidoPor,
      }
    });

    await prisma.pergunta.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir pergunta' }, { status: 500 });
  }
}
