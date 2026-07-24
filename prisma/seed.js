const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function main() {
  const filePath = "C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\073e1a2b-c81b-4694-ac34-a9fce6a3f1be\\browser\\scratchpad_lrgneatv.md";
  const content = fs.readFileSync(filePath, 'utf-8');

  const lines = content.split('\n');
  let currentCategory = '';
  const questionsToInsert = [];

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('### ')) {
      currentCategory = line.replace('### ', '').replace(/^\d+\s/, '').trim();
    } else if (line.match(/^\d+\./)) {
      const match = line.match(/^\d+\.\s(.*?)\s+-\s+(.*)$/);
      if (match) {
        questionsToInsert.push({
          pergunta: match[1].trim(),
          resposta: match[2].trim(),
          categoria: currentCategory,
          nomeProfessor: "Sistema"
        });
      } else {
        const vfMatch = line.match(/^\d+\.\s(.*?)\s+Resposta:\s+(.*)$/i);
        if (vfMatch) {
          questionsToInsert.push({
            pergunta: vfMatch[1].trim(),
            resposta: vfMatch[2].trim(),
            categoria: currentCategory,
            nomeProfessor: "Sistema"
          });
        }
      }
    }
  }

  console.log(`Encontradas ${questionsToInsert.length} perguntas. Inserindo no banco de dados...`);

  for (const q of questionsToInsert) {
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
