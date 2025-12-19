# Gerador de Posts Bíblicos para Instagram

Gerador de posts bíblicos usando IA Gemini para criar conteúdo inspirador para Instagram.

## 🚀 Deploy no Vercel

1. Fork ou clone este repositório
2. Conecte ao Vercel
3. Configure a variável de ambiente `GEMINI_API_KEY` no painel do Vercel
4. Deploy automático!

## 📋 Configuração

### Variável de Ambiente (obrigatória)

No painel do Vercel → Settings → Environment Variables:

| Nome | Valor |
|------|-------|
| `GEMINI_API_KEY` | Sua chave da API Gemini |

## 🛠️ Estrutura

```
├── index.html     # Página principal
├── styles.css     # Estilos
├── script.js      # Lógica do frontend
├── vercel.json    # Configuração Vercel
└── api/
    └── gemini.js  # Serverless function
```

## 📝 Uso

1. Digite um tema (ex: "Amor de Deus")
2. Clique em "Gerar Posts"
3. Navegue pelos 3 posts gerados
4. Copie o conteúdo para usar no Instagram
