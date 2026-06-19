(function () {
    var toggle = document.querySelector('.menu-toggle');
    var mobileNav = document.querySelector('.mobile-nav');

    if (toggle && mobileNav) {
        toggle.addEventListener('click', function () {
            var open = mobileNav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    var hero = document.querySelector('[data-hero]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var current = 0;
        var timer = null;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        function startTimer() {
            timer = window.setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                window.clearInterval(timer);
                showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
                startTimer();
            });
        });

        startTimer();
    }

    var filterPanel = document.querySelector('.filter-panel');
    var list = document.querySelector('[data-filter-list]');

    if (filterPanel && list) {
        var searchInput = filterPanel.querySelector('[data-filter-search]');
        var categorySelect = filterPanel.querySelector('[data-filter-category]');
        var yearSelect = filterPanel.querySelector('[data-filter-year]');
        var items = Array.prototype.slice.call(list.children);

        function normalize(value) {
            return String(value || '').toLowerCase().trim();
        }

        function matchYear(itemYear, selectedYear) {
            if (!selectedYear) {
                return true;
            }

            var year = Number(itemYear || 0);

            if (selectedYear === '2020') {
                return year <= 2020;
            }

            return year === Number(selectedYear);
        }

        function applyFilters() {
            var query = normalize(searchInput ? searchInput.value : '');
            var category = categorySelect ? categorySelect.value : '';
            var year = yearSelect ? yearSelect.value : '';

            items.forEach(function (item) {
                var haystack = normalize([
                    item.getAttribute('data-title'),
                    item.getAttribute('data-year'),
                    item.getAttribute('data-region'),
                    item.getAttribute('data-type'),
                    item.getAttribute('data-category'),
                    item.textContent
                ].join(' '));
                var categoryOk = !category || item.getAttribute('data-category') === category;
                var yearOk = matchYear(item.getAttribute('data-year'), year);
                var queryOk = !query || haystack.indexOf(query) !== -1;
                item.classList.toggle('is-hidden', !(categoryOk && yearOk && queryOk));
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }
        if (categorySelect) {
            categorySelect.addEventListener('change', applyFilters);
        }
        if (yearSelect) {
            yearSelect.addEventListener('change', applyFilters);
        }
    }
})();
