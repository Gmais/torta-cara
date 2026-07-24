import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const classes = await prisma.turma.findMany({
      include: {
        _count: {
          select: { alunos: true }
        }
      },
      orderBy: { pontuacao: 'desc' }
    });
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar turmas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newClass = await prisma.turma.create({
      data: {
        nome: data.nome,
        pontuacao: 0,
      }
    });
    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar turma' }, { status: 500 });
  }
}
