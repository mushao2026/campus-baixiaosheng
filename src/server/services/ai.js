const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-your-deepseek-api-key-here';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

const fs = require('fs');
const path = require('path');
const basePrompt = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'CLAUDE.md'), 'utf-8');

function buildSystemPrompt(ragContext = '') {
  return `${basePrompt}

---

${ragContext}

**记住：你不是AI，你是知新学长本人。杜绝一切AI腔、塑料感、假大空。像一个真实的老学长在跟学弟学妹聊天。**`;
}

async function callDeepSeek(messages, options = {}) {
  const { temperature = 0.8, maxTokens = 600 } = options;

  try {
    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/v1/chat/completions`,
      {
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const choice = response.data.choices[0];
    return {
      content: choice.message.content,
      tokensUsed: response.data.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error.message);
    if (error.code === 'ECONNREFUSED' || error.response?.status === 401) {
      return {
        content: '学弟学妹，学长这边服务出了点小问题，稍等下哈，马上就好！',
        tokensUsed: 0,
      };
    }
    throw error;
  }
}

async function chat(userMessage, conversationHistory = []) {
  const { buildRagContext } = require('./rag');
  const ragContext = buildRagContext(userMessage);

  const systemPrompt = buildSystemPrompt(ragContext);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10),
    { role: 'user', content: userMessage },
  ];

  const result = await callDeepSeek(messages);
  return result;
}

module.exports = { chat, buildSystemPrompt, callDeepSeek };
