const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const DISCIPLINAS = [
  'Biologia/Ecologia',
  'Anatomia/Fisiologia Humana',
  'Química',
  'Física',
  'Astronomia',
  'História',
  'Geografia',
  'Literatura/Português',
  'Inglês',
  'Matemática',
  'Artes/Cultura/Cinema',
  'Religião/Mitologia',
  'Esportes',
  'Medicina/Saúde',
  'Informática/Tecnologia',
  'Diversos/Geral',
];

async function main() {
  for (const nome of DISCIPLINAS) {
    await prisma.categoria.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }
  console.log(`${DISCIPLINAS.length} disciplinas garantidas na tabela Categoria.`);

  const filePath = path.join(__dirname, 'perguntas.json');
  const content = fs.readFileSync(filePath, 'utf-8');
  const questionsToInsert = JSON.parse(content);

  console.log(`Encontradas ${questionsToInsert.length} perguntas. Inserindo no banco de dados...`);

  // Count to check if we already seeded to avoid duplication on Vercel
  const existingCount = await prisma.pergunta.count();
  if (existingCount > 0) {
    console.log(`O banco já possui ${existingCount} perguntas. Ignorando a inserção inicial.`);
  } else {
    for (const q of questionsToInsert) {
      await prisma.pergunta.create({
        data: q
      });
    }
  }

  await prisma.configuracao.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      pontosPorRodada: 10
    }
  });

  console.log('Seed completo!');
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
