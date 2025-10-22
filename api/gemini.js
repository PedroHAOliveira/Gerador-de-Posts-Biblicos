// api/gemini.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { contents, generationConfig } = req.body;

  // 💡 CORREÇÃO 1: Use o nome da variável de ambiente que você configurou no Vercel.
  const GEMINI_API_KEY = process.env.API_KEY; 

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Chave da API não configurada no ambiente Vercel.' });
  }

  try {
    // 💡 CORREÇÃO 2: Altere a versão da API de v1beta para v1 (estável)
    const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

    const response = await fetch(
      API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Retorna a mensagem de erro detalhada do Gemini
      return res.status(response.status).json({ 
          error: data.error?.message || data.error || 'Erro desconhecido na API Gemini' 
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao chamar Gemini API:', error);
    res.status(500).json({ error: 'Erro interno ao se comunicar com a API Gemini' });
  }
}
