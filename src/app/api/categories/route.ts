import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Retorna todas as categorias únicas extraídas das perguntas
export async function GET() {
  try {
    const questions = await prisma.pergunta.findMany({
      select: { categoria: true }
    });
    const questionCats = questions.map(q => q.categoria);
    
    const dbCats = await prisma.categoria.findMany();
    const dbCatNames = dbCats.map(c => c.nome);
    
    const uniqueCategories = Array.from(new Set([...questionCats, ...dbCatNames]));
    return NextResponse.json(uniqueCategories.sort());
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { categoria } = await request.json();
    if (!categoria) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }
    await prisma.categoria.upsert({
      where: { nome: categoria },
      update: {},
      create: { nome: categoria }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}

// PUT: Renomeia uma categoria em lote
export async function PUT(request: Request) {
  try {
    const { oldName, newName } = await request.json();
    
    // Atualiza tabela de perguntas
    await prisma.pergunta.updateMany({
      where: { categoria: oldName },
      data: { categoria: newName }
    });
    
    // Atualiza tabela de categorias se existir, senao cria
    try {
      await prisma.categoria.update({
        where: { nome: oldName },
        data: { nome: newName }
      });
    } catch(e) {
      // Se a categoria antiga nao existia na tabela nova, apenas cria a nova
      await prisma.categoria.upsert({
        where: { nome: newName },
        update: {},
        create: { nome: newName }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao renomear categoria' }, { status: 500 });
  }
}

// DELETE: Exclui todas as perguntas de uma categoria
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('name');
    if (!categoria) return NextResponse.json({ error: 'Nome da categoria não fornecido' }, { status: 400 });

    // Deleta perguntas
    await prisma.pergunta.deleteMany({
      where: { categoria }
    });
    
    // Deleta categoria da tabela (se existir)
    try {
      await prisma.categoria.delete({
        where: { nome: categoria }
      });
    } catch(e) {}
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
