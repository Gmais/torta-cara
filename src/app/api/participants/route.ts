import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get('turmaId');

  try {
    const participants = await prisma.participante.findMany({
      where: turmaId ? { turmaId } : undefined,
    });
    return NextResponse.json(participants);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar participantes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newParticipant = await prisma.participante.create({
      data: {
        nome: data.nome,
        turmaId: data.turmaId,
      }
    });
    return NextResponse.json(newParticipant, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar participante' }, { status: 500 });
  }
}
