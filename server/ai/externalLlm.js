/**
 * External LLM Provider Integration (Gemini, OpenAI, Groq)
 * Secure server-side proxy; API keys are never leaked to frontend.
 */

const https = require('https');

async function callExternalLlm({ prompt, systemPrompt, conversationHistory = [], dbContext = null, provider = 'gemini' }) {
  // Keys are server-side environment variables only; never accept them from the browser.
  const activeKey = provider === 'openai'
    ? process.env.OPENAI_API_KEY
    : process.env.GEMINI_API_KEY;
  if (!activeKey) {
    return null;
  }

  try {
    if (provider === 'gemini') {
      return await callGeminiApi({ prompt, systemPrompt, conversationHistory, dbContext, key: activeKey });
    } else if (provider === 'openai') {
      return await callOpenAiApi({ prompt, systemPrompt, conversationHistory, dbContext, key: activeKey });
    }
  } catch (err) {
    console.error('External LLM error, falling back to local engine:', err.message);
    return null;
  }

  return null;
}

function callGeminiApi({ prompt, systemPrompt, conversationHistory, dbContext, key }) {
  return new Promise((resolve, reject) => {
    let fullSystemInstruction = systemPrompt || 'You are UniMate AI, an intelligent university and general assistant.';
    if (dbContext) {
      fullSystemInstruction += `\n\nOFFICIAL GROUNDED UNIVERSITY DATABASE RECORDS:\n${JSON.stringify(dbContext, null, 2)}\n\nRULE: Ground all university answers strictly in the records above. NEVER invent or hallucinate university data, grades, marks, or faculty. If unknown, say "I couldn't find that information in the university database."`;
    }

    const contents = [];
    // Include last few history turns
    const recentHistory = conversationHistory.slice(-4);
    for (const h of recentHistory) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const postData = JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: fullSystemInstruction }]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500
      }
    });

    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const errorCode = json.error && json.error.status ? json.error.status : `HTTP_${res.statusCode}`;
            console.error(`Gemini API request rejected (${errorCode}). Check the server-side API key, model access, and quota.`);
            resolve(null);
            return;
          }

          if (json.candidates && json.candidates[0] && json.candidates[0].content) {
            const text = json.candidates[0].content.parts.map(p => p.text).join('\n');
            resolve(text);
          } else {
            console.error('Gemini API returned no candidate response.');
            resolve(null);
          }
        } catch (e) {
          console.error(`Gemini API response was not valid JSON (HTTP_${res.statusCode}).`);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`Gemini network request failed (${err.code || 'NETWORK_ERROR'}).`);
      resolve(null);
    });
    req.on('timeout', () => {
      console.error('Gemini network request timed out.');
      req.destroy();
      resolve(null);
    });
    req.write(postData);
    req.end();
  });
}

function callOpenAiApi({ prompt, systemPrompt, conversationHistory, dbContext, key }) {
  return new Promise((resolve, reject) => {
    let fullSystem = systemPrompt || 'You are UniMate AI, an intelligent university and general assistant.';
    if (dbContext) {
      fullSystem += `\n\nOFFICIAL GROUNDED UNIVERSITY RECORDS:\n${JSON.stringify(dbContext, null, 2)}\n\nRULE: Ground all university answers in the above records. NEVER invent university data.`;
    }

    const messages = [{ role: 'system', content: fullSystem }];
    const recent = conversationHistory.slice(-4);
    for (const h of recent) {
      messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
    }
    messages.push({ role: 'user', content: prompt });

    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.choices && json.choices[0] && json.choices[0].message) {
            resolve(json.choices[0].message.content);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

module.exports = {
  callExternalLlm
};
