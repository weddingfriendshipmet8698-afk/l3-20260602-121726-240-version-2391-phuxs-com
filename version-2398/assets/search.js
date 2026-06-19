(function () {
    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"]/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            }[character];
        });
    }

    function getQuery() {
        var params = new URLSearchParams(window.location.search);
        return params.get('q') || '';
    }

    function createCard(movie) {
        var tags = (movie.tags || []).slice(0, 2).map(function (tag) {
            return '<span>' + escapeHtml(tag) + '</span>';
        }).join('');

        return [
            '<article class="movie-card">',
            '  <a class="card-link" href="./movie/' + encodeURIComponent(movie.id) + '.html">',
            '    <div class="poster" data-title="' + escapeHtml(movie.title) + '">',
            '      <img src="./' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + ' 封面" loading="lazy">',
            '      <span class="type-badge">' + escapeHtml(movie.type) + '</span>',
            '      <span class="category-badge">' + escapeHtml(movie.categoryName) + '</span>',
            '    </div>',
            '    <div class="card-body">',
            '      <h3>' + escapeHtml(movie.title) + '</h3>',
            '      <p>' + escapeHtml(movie.oneLine) + '</p>',
            '      <div class="card-meta">',
            '        <span>' + escapeHtml(movie.year) + '</span>',
            '        <span>' + escapeHtml(movie.region) + '</span>',
            '      </div>',
            '      <div class="tag-row">' + tags + '</div>',
            '    </div>',
            '  </a>',
            '</article>'
        ].join('\n');
    }

    function initSearch() {
        var query = getQuery().trim();
        var results = document.querySelector('[data-search-results]');
        var title = document.querySelector('[data-search-title]');
        var summary = document.querySelector('[data-search-summary]');
        var empty = document.querySelector('[data-search-empty]');
        var pageInput = document.querySelector('.search-page-form input[name="q"]');
        var movies = window.SITE_MOVIES || [];

        if (!results) {
            return;
        }

        if (pageInput) {
            pageInput.value = query;
        }

        if (!query) {
            results.innerHTML = '';
            if (title) {
                title.textContent = '搜索结果';
            }
            if (summary) {
                summary.textContent = '请输入关键词开始搜索。';
            }
            if (empty) {
                empty.hidden = true;
            }
            return;
        }

        var normalizedQuery = normalize(query);
        var matched = movies.filter(function (movie) {
            var haystack = normalize([
                movie.title,
                movie.region,
                movie.type,
                movie.year,
                movie.genre,
                movie.oneLine,
                movie.summary,
                movie.categoryName,
                (movie.tags || []).join(' ')
            ].join(' '));
            return haystack.indexOf(normalizedQuery) !== -1;
        });

        if (title) {
            title.textContent = '关键词：“' + query + '”';
        }
        if (summary) {
            summary.textContent = '找到 ' + matched.length + ' 个相关结果。';
        }

        results.innerHTML = matched.slice(0, 240).map(createCard).join('\n');

        if (empty) {
            empty.hidden = matched.length !== 0;
        }

        document.querySelectorAll('.poster img').forEach(function (image) {
            image.addEventListener('error', function () {
                var holder = image.closest('.poster');
                if (holder) {
                    holder.classList.add('is-missing');
                }
                image.remove();
            }, { once: true });
        });
    }

    document.addEventListener('DOMContentLoaded', initSearch);
})();
