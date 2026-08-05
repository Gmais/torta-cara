import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const ids: unknown = data.ids;
    const excluidoPor = typeof data.excluidoPor === 'string' ? data.excluidoPor.trim() : '';

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Nenhuma pergunta selecionada' }, { status: 400 });
    }
    if (!excluidoPor) {
      return NextResponse.json({ error: 'Nome de quem está excluindo é obrigatório' }, { status: 400 });
    }

    const perguntas = await prisma.pergunta.findMany({ where: { id: { in: ids } } });

    await prisma.perguntaExcluida.createMany({
      data: perguntas.map(p => ({
        perguntaId: p.id,
        pergunta: p.pergunta,
        resposta: p.resposta,
        categoria: p.categoria,
        excluidoPor,
      }))
    });

    await prisma.pergunta.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ success: true, count: perguntas.length });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir perguntas' }, { status: 500 });
  }
}
