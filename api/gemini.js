// api/gemini.js - Vercel Serverless Function

export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // Verificar API Key
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY não está configurada');
    return res.status(500).json({ 
      error: 'Chave da API não configurada. Configure GEMINI_API_KEY nas variáveis de ambiente do Vercel.' 
    });
  }

  // Validar body da requisição
  if (!req.body || typeof req.body !== 'object') {
    console.error('Body da requisição inválido:', req.body);
    return res.status(400).json({ 
      error: 'Corpo da requisição inválido ou vazio.' 
    });
  }

  const { contents, generationConfig } = req.body;

  // Validar contents
  if (!contents || !Array.isArray(contents) || contents.length === 0) {
    console.error('Contents inválido:', contents);
    return res.status(400).json({ 
      error: 'O campo "contents" é obrigatório e deve ser um array.' 
    });
  }

  try {
    // Usar modelo gemini-1.5-flash (mais estável e disponível)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents,
      generationConfig: generationConfig || {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048
      }
    };

    console.log('Chamando Gemini API com:', JSON.stringify(requestBody, null, 2).substring(0, 500));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro da API Gemini:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || data.error || 'Erro desconhecido na API Gemini' 
      });
    }

    // Retornar resposta de sucesso
    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro ao chamar Gemini API:', error);
    return res.status(500).json({ 
      error: 'Erro interno ao se comunicar com a API Gemini: ' + error.message 
    });
  }
}
