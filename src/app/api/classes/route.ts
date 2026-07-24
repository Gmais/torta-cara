import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const classes = await prisma.turma.findMany({
      include: {
        _count: { select: { alunos: true } },
        alunos: { select: { id: true, nome: true } },
        competicao: { select: { id: true, nome: true } }
      },
      orderBy: { nome: 'asc' }
    });
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar turmas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nome, competicaoId } = await request.json();
    if (!nome) return NextResponse.json({ error: 'Nome da turma é obrigatório' }, { status: 400 });
    
    const newClass = await prisma.turma.create({
      data: { 
        nome,
        ...(competicaoId ? { competicaoId } : {})
      }
    });
    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar turma' }, { status: 500 });
  }
}
