// api/gemini.js

export default async function handler(req, res) {
  // Garante que a requisição é um POST, conforme esperado pelo front-end
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // Desestrutura os dados enviados pelo seu script.js
  const { contents, generationConfig } = req.body;

  // Usa a variável de ambiente configurada no painel do Vercel
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

  if (!GEMINI_API_KEY) {
    // Retorna erro 500 se a chave não estiver definida (boa prática de segurança)
    return res.status(500).json({ error: 'Chave da API não configurada no ambiente Vercel.' });
  }

  try {
    // CORREÇÃO: Usa a versão de API estável 'v1' e o modelo 2.5 Flash
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
          generationConfig // Inclui a configuração (temperature, topP, etc.)
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Propaga o código de status e a mensagem de erro detalhada da API Gemini para o front-end
      return res.status(response.status).json({ 
          error: data.error?.message || data.error || 'Erro desconhecido na API Gemini' 
      });
    }

    // Retorna os dados de sucesso do Gemini para o front-end
    res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao chamar Gemini API:', error);
    // Retorna erro interno em caso de falha na comunicação (ex: erro de rede)
    res.status(500).json({ error: 'Erro interno ao se comunicar com a API Gemini' });
  }
}
