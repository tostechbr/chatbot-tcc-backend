const fs = require('fs').promises;
const path = require('path');

async function testReadInstructionsFile() {
  try {
    const instructionsPath = path.join(__dirname, 'instructions.txt');
    const instructionsContent = await fs.readFile(instructionsPath, 'utf8');
    console.log('Conteúdo do arquivo de instruções:', instructionsContent);
  } catch (error) {
    console.error('Erro ao ler o arquivo de instruções:', error);
  }
}

testReadInstructionsFile();
