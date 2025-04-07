// script.js - Gerador de Posts para Instagram com Navegação e Cópia
document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const DOM = {
        themeInput: document.getElementById('themeInput'),
        promptInput: document.getElementById('promptInput'),
        generateBtn: document.getElementById('generateBtn'),
        btnText: document.getElementById('btnText'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        errorMessage: document.getElementById('errorMessage'),
        carouselContainer: document.getElementById('carouselContainer'),
        carouselNav: document.getElementById('carouselNav'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        copyBtn: document.getElementById('copyBtn')
    };

    // Estado do Carrossel
    let currentSlide = 0;
    let intervalId;
    let currentTheme = '';
    let postsData = [];

    // Configuração da API
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY || GEMINI_CONFIG.API_KEY}`;

    // Event Listeners
    DOM.generateBtn.addEventListener('click', handleGenerateClick);
    DOM.prevBtn.addEventListener('click', showPreviousSlide);
    DOM.nextBtn.addEventListener('click', showNextSlide);
    DOM.copyBtn.addEventListener('click', copyCurrentSlide);

    // Função Principal
    async function handleGenerateClick() {
        currentTheme = DOM.themeInput.value.trim();
        
        if (!currentTheme) {
            showError('Por favor, digite um tema válido');
            DOM.themeInput.focus();
            return;
        }

        try {
            startLoading();
            hideError();
            clearCarousel();

            postsData = await fetchPostsData(currentTheme);
            renderCarousel(postsData);
            startCarousel();
            showCarouselControls();
            DOM.carouselContainer.style.display = 'block';

        } catch (error) {
            console.error('Erro na geração:', error);
            showError(`Erro: ${error.message}`);
            renderFallbackContent();
        } finally {
            finishLoading();
        }
    }

    // Obter dados da API
    async function fetchPostsData(theme) {
        try {
            const prompt = buildPrompt(theme);
            console.log('Prompt enviado:', prompt);

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        topP: 0.9,
                        topK: 40,
                        maxOutputTokens: 2000
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Erro HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return parseApiResponse(data);

        } catch (error) {
            console.error('Erro na API:', error);
            throw new Error(`Falha ao gerar posts: ${error.message}`);
        }
    }

    // Construir o prompt
    function buildPrompt(theme) {
        const customInstruction = DOM.promptInput.value.trim();
        
        return `Gere apenas 3 posts para Instagram sobre "${theme}" no formato EXATO abaixo:

**Post 1:**
- Imagem: [Descrição detalhada referente ao texto bíblico]
- Legenda: [Texto bíblico em português com 3-5 hashtags e **referência bíblica no final do texto é imprescindível**]

**Post 2:**
- Imagem: [Descrição detalhada referente ao texto bíblico]
- Legenda: [Texto bíblico em português com 3-5 hashtags e **referência bíblica no final do texto é imprescindível**]

**Post 3:**
- Imagem: [Descrição detalhada referente ao texto bíblico]
- Legenda: [Texto bíblico em português com 3-5 hashtags e **referência bíblica no final do texto é imprescindível**]

Regras:
1. Seja criativo
2. **Referência bíblica no final do texto é imprescindível**  
3. Mantenha este formato exato

${customInstruction ? `Instruções extras: ${customInstruction}` : ''}`;
    }

    // Processar resposta da API
    function parseApiResponse(data) {
        try {
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) throw new Error('Resposta vazia da API');

            // Extrair posts usando regex
            const postPattern = /\*\*Post \d+:\*\*\s*- Imagem: (.*?)\s*- Legenda: (.*?)(?=\n\*\*Post|\n$)/gs;
            const matches = [...content.matchAll(postPattern)];

            if (matches.length === 0) throw new Error('Formato não reconhecido');

            return matches.map((match, index) => ({
                id: index + 1,
                imageDescription: sanitizeContent(match[1].trim()),
                caption: formatCaption(match[2].trim())
            }));

        } catch (error) {
            console.error('Erro no parse:', error);
            throw new Error('Não foi possível interpretar os posts');
        }
    }

    // Formatar legenda
    function formatCaption(caption) {
        const hashtags = caption.match(/#[\wÀ-ú]+/g)?.join(' ') || '';
        const text = caption.replace(/#[\wÀ-ú]+/g, '').trim();
        
        return {
            text: sanitizeContent(text),
            hashtags: sanitizeContent(hashtags)
        };
    }

    // Renderizar carrossel
    function renderCarousel(posts) {
        DOM.carouselContainer.innerHTML = '';
        DOM.carouselNav.innerHTML = '';

        posts.forEach((post, index) => {
            // Criar slide
            const slide = document.createElement('div');
            slide.className = `post-slide ${index === 0 ? 'active' : ''}`;
            slide.dataset.index = index;
            slide.innerHTML = `
                <div class="post-header">Post #${post.id}</div>
                <div class="post-content">
                    <div class="image-description">
                        <h3>📷 Descrição da Imagem</h3>
                        <p>${post.imageDescription}</p>
                    </div>
                    <div class="post-caption">
                        <h3>✍️ Legenda</h3>
                        <p>${post.caption.text}</p>
                        ${post.caption.hashtags ? `<div class="hashtags">${post.caption.hashtags}</div>` : ''}
                    </div>
                </div>
            `;
            DOM.carouselContainer.appendChild(slide);

            // Criar indicador de navegação
            const dot = document.createElement('button');
            dot.className = `carousel-nav-dot ${index === 0 ? 'active' : ''}`;
            dot.dataset.index = index;
            dot.innerHTML = `<span class="sr-only">Post ${post.id}</span>`;
            dot.addEventListener('click', () => goToSlide(index));
            DOM.carouselNav.appendChild(dot);
        });
    }

    // Navegação
    function showNextSlide() {
        const slides = document.querySelectorAll('.post-slide');
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
        resetCarouselInterval();
    }

    function showPreviousSlide() {
        const slides = document.querySelectorAll('.post-slide');
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateCarousel();
        resetCarouselInterval();
    }

    function goToSlide(index) {
        currentSlide = index;
        updateCarousel();
        resetCarouselInterval();
    }

    function updateCarousel() {
        document.querySelectorAll('.post-slide').forEach((slide, i) => {
            slide.classList.toggle('active', i === currentSlide);
        });
        
        document.querySelectorAll('.carousel-nav-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    // Copiar slide atual
    function copyCurrentSlide() {
        if (postsData.length === 0) return;

        const currentPost = postsData[currentSlide];
        const contentToCopy = `📷 Descrição da Imagem:\n${currentPost.imageDescription.replace(/<br>/g, '\n')}\n\n` +
                             `✍️ Legenda:\n${currentPost.caption.text.replace(/<br>/g, '\n')}\n\n` +
                             `🏷️ Hashtags: ${currentPost.caption.hashtags.replace(/<br>/g, ' ')}`;

        navigator.clipboard.writeText(contentToCopy)
            .then(() => {
                showCopyFeedback();
            })
            .catch(err => {
                console.error('Erro ao copiar:', err);
                showError('Falha ao copiar. Tente novamente.');
            });
    }

    function showCopyFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'copy-feedback';
        feedback.textContent = 'Copiado!';
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.classList.add('fade-out');
            setTimeout(() => feedback.remove(), 500);
        }, 1000);
    }

    // Controles do carrossel
    function startCarousel() {
        stopCarousel();
        intervalId = setInterval(showNextSlide, 8000);
    }

    function stopCarousel() {
        clearInterval(intervalId);
    }

    function resetCarouselInterval() {
        stopCarousel();
        startCarousel();
    }

    function showCarouselControls() {
        DOM.prevBtn.style.display = 'block';
        DOM.nextBtn.style.display = 'block';
        DOM.copyBtn.style.display = 'block';
    }

    function clearCarousel() {
        DOM.carouselContainer.innerHTML = '<div class="carousel-nav" id="carouselNav"></div>';
        DOM.carouselNav = document.getElementById('carouselNav');
        currentSlide = 0;
        
        DOM.prevBtn.style.display = 'none';
        DOM.nextBtn.style.display = 'none';
        DOM.copyBtn.style.display = 'none';
    }

    // Fallback
    function renderFallbackContent() {
        DOM.carouselContainer.innerHTML = `
            <div class="post-slide active">
                <div class="post-header">Ops!</div>
                <div class="post-content">
                    <div class="error-content">
                        <p>Não foi possível gerar os posts.</p>
                        <p>Tente novamente com outro tema.</p>
                    </div>
                </div>
            </div>
        `;
        DOM.carouselContainer.style.display = 'block';
    }

    // Utilitários
    function sanitizeContent(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

    function startLoading() {
        DOM.generateBtn.disabled = true;
        DOM.loadingSpinner.style.display = 'block';
        DOM.btnText.textContent = 'Gerando...';
    }

    function finishLoading() {
        DOM.generateBtn.disabled = false;
        DOM.loadingSpinner.style.display = 'none';
        DOM.btnText.textContent = 'Gerar Posts';
    }

    function showError(message) {
        DOM.errorMessage.textContent = message;
        DOM.errorMessage.style.display = 'block';
        DOM.errorMessage.scrollIntoView({ behavior: 'smooth' });
    }

    function hideError() {
        DOM.errorMessage.style.display = 'none';
    }
});
