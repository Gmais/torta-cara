import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const competitions = await prisma.competicao.findMany({
      include: {
        turmas: {
          select: { id: true, nome: true }
        }
      },
      orderBy: { nome: 'asc' }
    });
    return NextResponse.json(competitions);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar competições' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nome } = await request.json();
    if (!nome) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const newComp = await prisma.competicao.create({
      data: { nome }
    });
    return NextResponse.json(newComp);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar competição' }, { status: 500 });
  }
}
