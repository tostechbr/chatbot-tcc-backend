const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');


const openai = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v1'
  }
});

// Definindo getOpenAI para retornar a instância configurada
function getOpenAI() {
  return openai;
}

async function uploadFile(filePath) {
  try {
    const fileContent = await fs.readFile(filePath);
    const response = await openai.post('/files', fileContent, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      params: {
        purpose: 'assistants'
      }
    });
    return response.data.id; // Return the file ID from the response
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}


async function createAssistant() {
  try {
    const filePath = path.join(__dirname, 'src', 'api', 'ConvertCodeToPromptBuilderFormat.md');
    const fileId = await uploadFile(filePath); 

    const instructionsPath = path.join(__dirname, 'instructions.txt');
    const instructionsContent = await fs.readFile(instructionsPath, 'utf8');

    const response = await openai.post('/assistants', {
      name: "Chatbot-dima",
      instructions: instructionsContent,
      tools: [{ type: "code_interpreter" }],
      model: "gpt-4-turbo-preview",
      file_ids: [fileId]
    });

    return response.data;

  } catch (error) {
    console.error('Erro ao criar assistente:', error);
    throw error;
  }
}

// Função para listar os Assistants
async function listAssistants() {
  try {
    const response = await openai.get('/assistants');
    return response.data;
  } catch (error) {
    console.error('Erro ao listar assistentes:', error);
    throw error;
  }
}

//Deletar um Assistant
async function deleteAssistant(assistantId) {
  try {
    const response = await openai.delete(`/assistants/${assistantId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar assistente:', error);
    throw error;
  }
}

// Função para criar uma Thread
async function createThread() {
  try {
    const response = await openai.post('/threads', {}); // Exemplo de envio de dados para a API
    return response.data;
  } catch (error) {
    if (error.response) {
    } else if (error.request) {
      console.log(error.request);
    } else {
      console.log('Error', error.message);
    }
    throw error;
  }
}


// Função para adicionar uma mensagem à Thread
async function addMessageToThread(threadId, content) {
  console.log("addMessageToThread", threadId, content)
  try {
    const response = await openai.post(`/threads/${threadId}/messages`, {
      role: "user",
      content: content,
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar mensagem à thread:', error);
    throw error;
  }
}

// Função para executar o assistente (criar um Run)
async function executeAssistant(threadId, instructions) {
  try {
    const response = await openai.post(`/threads/${threadId}/runs`, {
      assistant_id: `asst_eMJds0rYibFLx1UczBUCdc1W`,
      instructions,
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao executar assistente:', error);
    throw error;
  }
}

// Função para verificar o status do Run
async function checkRunStatus(threadId, runId) {
  try {
    const response = await openai.get(`/threads/${threadId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar status do run:', error);
    throw error;
  }
}

// Função para listar mensagens da Thread após o Run
async function listThreadMessages(threadId) {
  try {
    const response = await openai.get(`/threads/${threadId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar mensagens da thread:', error);
    throw error;
  }
}


// const messages = await listThreadMessages(thread.id);
module.exports = { getOpenAI, createAssistant, listAssistants, deleteAssistant, createThread, addMessageToThread, executeAssistant, checkRunStatus, listThreadMessages };
