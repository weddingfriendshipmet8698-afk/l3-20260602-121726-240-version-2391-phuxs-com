import { H as Hls } from './hls.js';
import './search-data.js';

const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

function initNavigation() {
    const toggle = qs('[data-nav-toggle]');
    const nav = qs('[data-main-nav]');

    if (!toggle || !nav) {
        return;
    }

    toggle.addEventListener('click', () => {
        nav.classList.toggle('open');
    });
}

function initHero() {
    const root = qs('[data-hero]');

    if (!root) {
        return;
    }

    const slides = qsa('.hero-slide', root);
    const dots = qsa('[data-hero-dot]', root);
    const prev = qs('[data-hero-prev]', root);
    const next = qs('[data-hero-next]', root);
    let active = 0;
    let timer = null;

    const show = (index) => {
        active = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('active', slideIndex === active);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === active);
        });
    };

    const restart = () => {
        window.clearInterval(timer);
        timer = window.setInterval(() => show(active + 1), 5200);
    };

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            show(index);
            restart();
        });
    });

    if (prev) {
        prev.addEventListener('click', () => {
            show(active - 1);
            restart();
        });
    }

    if (next) {
        next.addEventListener('click', () => {
            show(active + 1);
            restart();
        });
    }

    restart();
}

function initPageFilter() {
    const panel = qs('[data-filter-panel]');
    const input = qs('[data-page-filter]');
    const list = qs('[data-filter-list]');

    if (!panel || !input || !list) {
        return;
    }

    const items = qsa('.movie-card', list);
    const buttons = qsa('[data-filter-tag]', panel);
    let activeTag = '';

    const apply = () => {
        const keyword = input.value.trim().toLowerCase();
        items.forEach((item) => {
            const haystack = [
                item.dataset.title || '',
                item.dataset.year || '',
                item.dataset.type || '',
                item.dataset.tags || ''
            ].join(' ').toLowerCase();
            const matchedKeyword = !keyword || haystack.includes(keyword);
            const matchedTag = !activeTag || haystack.includes(activeTag.toLowerCase());
            item.style.display = matchedKeyword && matchedTag ? '' : 'none';
        });
    };

    input.addEventListener('input', apply);

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const tag = button.dataset.filterTag || '';
            activeTag = activeTag === tag ? '' : tag;
            buttons.forEach((item) => item.classList.toggle('active', item === button && activeTag));
            apply();
        });
    });
}

function createSearchCard(movie) {
    const tags = (movie.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');

    return `
        <article class="movie-card">
            <a class="poster" href="${movie.href}">
                <img src="${movie.image}" alt="${escapeHtml(movie.title)}" loading="lazy">
                <span class="poster-badge">${escapeHtml(movie.year)}</span>
            </a>
            <div class="movie-card-body">
                <div class="movie-meta">
                    <span>${escapeHtml(movie.region)}</span>
                    <span>${escapeHtml(movie.type)}</span>
                </div>
                <h2><a href="${movie.href}">${escapeHtml(movie.title)}</a></h2>
                <p>${escapeHtml(movie.oneLine)}</p>
                <div class="tag-row">${tags}</div>
            </div>
        </article>
    `;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function initSearchPage() {
    const page = qs('[data-search-page]');

    if (!page) {
        return;
    }

    const input = qs('[data-search-input]', page);
    const results = qs('[data-search-results]', page);
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') || '';

    if (input) {
        input.value = initialQuery;
    }

    const data = Array.isArray(window.MOVIE_SEARCH_DATA) ? window.MOVIE_SEARCH_DATA : [];

    const render = () => {
        const keyword = (input ? input.value : '').trim().toLowerCase();
        const matched = data.filter((movie) => {
            if (!keyword) {
                return true;
            }

            const haystack = [
                movie.title,
                movie.year,
                movie.region,
                movie.type,
                movie.category,
                movie.oneLine,
                ...(movie.tags || [])
            ].join(' ').toLowerCase();

            return haystack.includes(keyword);
        }).slice(0, 80);

        if (!results) {
            return;
        }

        if (!matched.length) {
            results.innerHTML = '<div class="empty-state">没有找到匹配内容</div>';
            return;
        }

        results.innerHTML = matched.map(createSearchCard).join('');
    };

    if (input) {
        input.addEventListener('input', render);
    }

    render();
}

function attachSource(video, source) {
    if (!video || !source) {
        return;
    }

    if (video.dataset.ready === 'true') {
        return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.dataset.ready = 'true';
        return;
    }

    if (Hls && Hls.isSupported()) {
        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });

        hls.loadSource(source);
        hls.attachMedia(video);
        video.dataset.ready = 'true';
        video._hlsInstance = hls;
        return;
    }

    video.src = source;
    video.dataset.ready = 'true';
}

function initPlayers() {
    qsa('[data-player]').forEach((player) => {
        const video = qs('video[data-src]', player);
        const button = qs('[data-play-button]', player);

        if (!video || !button) {
            return;
        }

        const start = async () => {
            attachSource(video, video.dataset.src);
            button.classList.add('is-hidden');
            video.setAttribute('controls', 'controls');

            try {
                await video.play();
            } catch (error) {
                button.classList.remove('is-hidden');
                video.removeAttribute('controls');
            }
        };

        button.addEventListener('click', start);
        video.addEventListener('click', () => {
            if (video.paused) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    });
}

initNavigation();
initHero();
initPageFilter();
initSearchPage();
initPlayers();
