// Dentro de src/server.js ou onde você gerencia suas rotas
require('dotenv').config();

const express = require('express');

const { createAssistant, createThread, addMessageToThread, executeAssistant, checkRunStatus, listThreadMessages, listAssistants, deleteAssistant } = require('./api/openai');

const app = express();

app.use(express.json());

const cors = require('cors');
app.use(cors());



app.post('/api/create-assistant', async (req, res) => {
  try {
    const assistant = await createAssistant();
    res.json(assistant);
  } catch (error) {
    res.status(500).send({ message: "Erro ao criar assistente." });
  }
});

// Rota para listar todos os assistentes
app.get('/api/assistants', async (req, res) => {
  try {
    const assistants = await listAssistants();
    res.json(assistants);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erro ao listar assistentes." });
  }
});

// Rota para deletar um assistente específico
app.delete('/api/assistants/:assistantId', async (req, res) => {
  const { assistantId } = req.params;

  try {
    const deleteResponse = await deleteAssistant(assistantId);
    res.json(deleteResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: `Erro ao deletar assistente ${assistantId}.` });
  }
});

// Rota para criar uma nova thread
app.post('/api/threads', async (req, res) => {
  try {
    const thread = await createThread();
    res.json(thread);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erro ao criar thread." });
  }
});

// Rota para adicionar uma mensagem à thread
app.post('/api/threads/:threadId/messages', async (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;

  try {
    const message = await addMessageToThread(threadId, content);
    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erro ao adicionar mensagem à thread." });
  }
});

// Rota para executar o assistente (criar um Run)
app.post('/api/threads/:threadId/runs', async (req, res) => {
  const { threadId } = req.params;
  const { instructions } = req.body;

  try {
    const run = await executeAssistant(threadId, instructions);
    res.json(run);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erro ao executar assistente." });
  }
});

// Rota para verificar o status do Run
app.get('/api/threads/:threadId/runs/:runId', async (req, res) => {
  const { threadId, runId } = req.params;

  try {
    const runStatus = await checkRunStatus(threadId, runId);
    res.json(runStatus);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erro ao verificar status do run." });
  }
});

// Rota para listar mensagens da Thread
app.get('/api/threads/:threadId/messages', async (req, res) => {
  const { threadId } = req.params;

  try {
    const messages = await listThreadMessages(threadId);
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Erro ao listar mensagens da thread." });
  }
});

function waitForRunCompletion() {
  // Define um tempo de espera. Ajuste este valor conforme necessário.
  const waitTimeMs = 5000; // 5 segundos

  return new Promise(resolve => setTimeout(resolve, waitTimeMs));
}

app.post('/chat', async (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(400).json({ error: "Message field is required" });
    }
    const userMessage = req.body.message;

    // Cria uma nova thread
    const thread = await createThread();
    const threadId = thread.id;

    // Adiciona a mensagem do usuário à thread
    await addMessageToThread(threadId, userMessage);

    await executeAssistant(threadId, userMessage);
    await waitForRunCompletion(); // Substitua por uma lógica de espera real se necessário

    const messagesResponse = await listThreadMessages(threadId);

    console.log("Todas as mensagens:", JSON.stringify(messagesResponse.data, null, 2));

    const assistantResponses = messagesResponse.data.filter(msg => msg.role === 'assistant');
    console.log("Respostas do assistente:", JSON.stringify(assistantResponses, null, 2));

    const response = assistantResponses.map(msg => 
      msg.content.map(contentItem => {
        // Verifica se a estrutura esperada está presente
        if (contentItem.text && contentItem.text.value) {
          return contentItem.text.value;
        }
        return ''; // Retorna uma string vazia se a estrutura não estiver conforme esperado
      }).join('\n')
    ).join('\n');

    if (response) {
      res.json({ response });
    } else {
      res.status(404).json({ error: "Nenhuma resposta encontrada." });
    }
  } catch (error) {
    console.error("Erro detalhado: ", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

