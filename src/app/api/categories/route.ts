import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Retorna todas as categorias únicas extraídas das perguntas
export async function GET() {
  try {
    const questions = await prisma.pergunta.findMany({
      select: { categoria: true }
    });
    const uniqueCategories = Array.from(new Set(questions.map(q => q.categoria)));
    return NextResponse.json(uniqueCategories.sort());
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

// PUT: Renomeia uma categoria em lote
export async function PUT(request: Request) {
  try {
    const { oldName, newName } = await request.json();
    if (!oldName || !newName) return NextResponse.json({ error: 'Nomes inválidos' }, { status: 400 });

    const result = await prisma.pergunta.updateMany({
      where: { categoria: oldName },
      data: { categoria: newName }
    });
    
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao renomear categoria' }, { status: 500 });
  }
}

// DELETE: Exclui todas as perguntas de uma categoria
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ error: 'Nome da categoria não fornecido' }, { status: 400 });

    const result = await prisma.pergunta.deleteMany({
      where: { categoria: name },
    });
    
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
