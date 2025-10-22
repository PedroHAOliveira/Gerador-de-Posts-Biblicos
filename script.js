
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

    let currentSlide = 0;
    let intervalId;
    let postsData = [];

    // Endpoint da API protegida via função serverless
    const API_ENDPOINT = '/api/gemini.js';

    // Event Listeners
    DOM.generateBtn.addEventListener('click', handleGenerateClick);
    DOM.prevBtn.addEventListener('click', showPreviousSlide);
    DOM.nextBtn.addEventListener('click', showNextSlide);
    DOM.copyBtn.addEventListener('click', copyCurrentSlide);

    async function handleGenerateClick() {
        const theme = DOM.themeInput.value.trim();
        if (!theme) {
            showError('Por favor, digite um tema válido');
            DOM.themeInput.focus();
            return;
        }
        try {
            startLoading(); hideError(); clearCarousel();
            postsData = await fetchPostsData(theme);
            renderCarousel(postsData);
            startCarousel(); showCarouselControls();
            DOM.carouselContainer.style.display = 'block';
        } catch (err) {
            console.error('Erro na geração:', err);
            showError(`Erro: ${err.message}`);
            renderFallbackContent();
        } finally {
            finishLoading();
        }
    }

    async function fetchPostsData(theme) {
        const prompt = buildPrompt(theme);
        const res = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, topP: 0.9, topK: 40, maxOutputTokens: 1000 }
            })
        });
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        return parseApiResponse(data);
    }

    function buildPrompt(theme) {
        const extra = DOM.promptInput.value.trim();
        return `Gere apenas 3 posts para Instagram sobre "${theme}" no formato EXATO abaixo:

**Post 1:**
- Imagem: [Descrição detalhada referente ao texto bíblico]
- Legenda: [Texto bíblico em português com 3 hashtags e **referência bíblica no final do texto é imprescindível**]

**Post 2:**
- Imagem: [Descrição detalhada referente ao texto bíblico]
- Legenda: [Texto bíblico em português com 3 hashtags e **referência bíblica no final do texto é imprescindível**]

**Post 3:**
- Imagem: [Descrição detalhada referente ao texto bíblico]
- Legenda: [Texto bíblico em português com 3 hashtags e **referência bíblica no final do texto é imprescindível**]

Regras:
1. Seja conciso e direto
2. **Inclua a referência bíblica no final da legenda**
3. Mantenha este formato exato

${extra ? `Instruções extras: ${extra}` : ''}`;
    }

    function parseApiResponse(response) {
        const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const postRegex = /\*\*Post\s*(\d+):\*\*[\s\S]*?(?=(\*\*Post\s*\d+:\*\*)|$)/g;
        const posts = [];
        let match;
        while ((match = postRegex.exec(text)) !== null) {
            const segment = match[0];
            const id = parseInt(match[1], 10);

            const imgMatch = segment.match(/(?:\*\*?Imagem\*\*?:?)\s*(?:\*\*|\*\*\*|["“])?([\s\S]*?)(?=\n(?:-|\*\*?Legenda|\*\*?Post|\Z))/i);
            const imageDescription = imgMatch ? sanitizeContent(imgMatch[1]) : '';

            const captionMatch = segment.match(/(?:\*\*?Legenda\*\*?:?)\s*(?:\*\*|\*\*\*|["“])?([\s\S]*?)(?=\n(?:-|\*\*?Imagem|\*\*?Post|\Z))/i);
            const captionText = captionMatch ? captionMatch[1] : '';

            posts.push({ id, imageDescription, caption: formatCaption(captionText) });
        }
        if (posts.length === 0) {
            console.error('Nenhum post encontrado no conteúdo:', text);
            throw new Error('Não foi possível interpretar os posts');
        }
        return posts;
    }

    function formatCaption(caption) {
        const hashtags = caption.match(/#[\wÀ-ú]+/g)?.join(' ') || '';
        const text = caption.replace(/#[\wÀ-ú]+/g, '').trim();
        return { text: sanitizeContent(text), hashtags: sanitizeContent(hashtags) };
    }

    function sanitizeContent(str) {
        return str.replace(/^\*\*+/, '').replace(/["“”]+/g, '').trim();
    }
    function renderCarousel(posts) {
        DOM.carouselContainer.innerHTML = '';
        DOM.carouselNav.innerHTML = '';

        posts.forEach((post, index) => {
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

            const dot = document.createElement('button');
            dot.className = `carousel-nav-dot ${index === 0 ? 'active' : ''}`;
            dot.dataset.index = index;
            dot.innerHTML = `<span class="sr-only">Post ${post.id}</span>`;
            dot.addEventListener('click', () => goToSlide(index));
            DOM.carouselNav.appendChild(dot);
        });
    }

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

    function copyCurrentSlide() {
        if (postsData.length === 0) return;

        const currentPost = postsData[currentSlide];
        const contentToCopy = `📷 Descrição da Imagem:\n${currentPost.imageDescription.replace(/<br>/g, '\n')}\n\n` +
                             `✍️ Legenda:\n${currentPost.caption.text.replace(/<br>/g, '\n')}\n\n` +
                             `🏷️ Hashtags: ${currentPost.caption.hashtags.replace(/<br>/g, ' ')}`;

        navigator.clipboard.writeText(contentToCopy)
            .then(showCopyFeedback)
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
