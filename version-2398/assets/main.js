(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function initMobileNav() {
        var toggle = qs('[data-mobile-toggle]');
        var nav = qs('[data-mobile-nav]');

        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
            toggle.textContent = nav.classList.contains('is-open') ? '×' : '☰';
        });
    }

    function initSearchForms() {
        qsa('[data-search-form]').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = qs('input[name="q"], input[type="search"]', form);
                var query = input ? input.value.trim() : '';
                var action = form.getAttribute('action') || './search.html';

                if (!query) {
                    return;
                }

                window.location.href = action + '?q=' + encodeURIComponent(query);
            });
        });
    }

    function initHero() {
        var hero = qs('[data-hero]');

        if (!hero) {
            return;
        }

        var slides = qsa('[data-hero-slide]', hero);
        var dots = qsa('[data-hero-dot]', hero);
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                start();
            });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function initImageFallback() {
        qsa('.poster img, .mini-thumb img').forEach(function (image) {
            image.addEventListener('error', function () {
                var holder = image.closest('.poster') || image.closest('.mini-thumb');
                if (holder) {
                    holder.classList.add('is-missing');
                }
                image.remove();
            }, { once: true });
        });
    }

    function initFilters() {
        qsa('[data-filter-scope]').forEach(function (panel) {
            var section = panel.parentElement || document;
            var grid = qs('[data-filter-grid]', section);
            var cards = grid ? qsa('[data-movie-card]', grid) : [];
            var search = qs('[data-filter-search]', panel);
            var type = qs('[data-filter-type]', panel);
            var year = qs('[data-filter-year]', panel);
            var category = qs('[data-filter-category]', panel);
            var count = qs('[data-filter-count]', panel);
            var empty = qs('[data-filter-empty]', section);

            function isYearMatch(cardYear, selectedYear) {
                if (!selectedYear) {
                    return true;
                }

                if (selectedYear === '2022') {
                    var numericYear = parseInt(cardYear, 10);
                    return Number.isFinite(numericYear) && numericYear <= 2022;
                }

                return cardYear.indexOf(selectedYear) !== -1;
            }

            function apply() {
                var query = normalize(search && search.value);
                var selectedType = normalize(type && type.value);
                var selectedYear = normalize(year && year.value);
                var selectedCategory = normalize(category && category.value);
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = normalize([
                        card.dataset.title,
                        card.dataset.tags,
                        card.dataset.type,
                        card.dataset.year,
                        card.textContent
                    ].join(' '));
                    var matchesQuery = !query || haystack.indexOf(query) !== -1;
                    var matchesType = !selectedType || normalize(card.dataset.type).indexOf(selectedType) !== -1;
                    var matchesYear = isYearMatch(normalize(card.dataset.year), selectedYear);
                    var matchesCategory = !selectedCategory || normalize(card.dataset.category) === selectedCategory;
                    var shouldShow = matchesQuery && matchesType && matchesYear && matchesCategory;

                    card.hidden = !shouldShow;
                    if (shouldShow) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = visible + ' 部';
                }

                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            [search, type, year, category].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', apply);
                    control.addEventListener('change', apply);
                }
            });

            apply();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initMobileNav();
        initSearchForms();
        initHero();
        initImageFallback();
        initFilters();
    });
})();
