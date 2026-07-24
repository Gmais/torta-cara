import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const random = searchParams.get('random');
  const categoria = searchParams.get('categoria');

  try {
    if (random) {
      // Find a random question (could be optimized, but for SQLite this is fine)
      const count = await prisma.pergunta.count({
        where: categoria ? { categoria } : undefined
      });
      const skip = Math.floor(Math.random() * count);
      const question = await prisma.pergunta.findFirst({
        where: categoria ? { categoria } : undefined,
        skip,
      });
      return NextResponse.json(question);
    }

    const questions = await prisma.pergunta.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar perguntas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newQuestion = await prisma.pergunta.create({
      data: {
        pergunta: data.pergunta,
        resposta: data.resposta,
        categoria: data.categoria,
        nomeProfessor: data.nomeProfessor || null,
      }
    });
    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar pergunta' }, { status: 500 });
  }
}
