import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const updates: unknown = data.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Nenhuma pergunta para atualizar' }, { status: 400 });
    }

    const validUpdates = updates.filter(
      (u): u is { id: string; categoria: string } =>
        u && typeof u.id === 'string' && typeof u.categoria === 'string' && u.categoria.trim() !== ''
    );

    if (validUpdates.length === 0) {
      return NextResponse.json({ error: 'Nenhuma atualização válida' }, { status: 400 });
    }

    await prisma.$transaction(
      validUpdates.map(u =>
        prisma.pergunta.update({
          where: { id: u.id },
          data: { categoria: u.categoria, destaque: true },
        })
      )
    );

    return NextResponse.json({ success: true, count: validUpdates.length });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao reclassificar perguntas' }, { status: 500 });
  }
}
