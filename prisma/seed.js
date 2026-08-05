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

  console.log(`Encontradas ${questionsToInsert.length} perguntas no arquivo.`);

  // Insere só as que ainda não existem (por texto da pergunta), em vez de pular
  // tudo quando a tabela já tem alguma linha — isso apagava silenciosamente a
  // importação em massa sempre que o banco já tinha perguntas antigas.
  const existentes = await prisma.pergunta.findMany({ select: { pergunta: true } });
  const jaExistem = new Set(existentes.map(p => p.pergunta));
  const novas = questionsToInsert.filter(q => !jaExistem.has(q.pergunta));

  console.log(`${novas.length} perguntas novas a inserir (${questionsToInsert.length - novas.length} já existiam).`);

  for (const q of novas) {
    await prisma.pergunta.create({
      data: q
    });
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
