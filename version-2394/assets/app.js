(function () {
    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function initMenu() {
        var toggle = qs("[data-nav-toggle]");
        var panel = qs("[data-mobile-panel]");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function initHero() {
        var slider = qs("[data-hero-slider]");
        if (!slider) {
            return;
        }
        var slides = qsa(".hero-slide", slider);
        var thumbs = qsa("[data-slide-to]", slider);
        var prev = qs("[data-slide-prev]", slider);
        var next = qs("[data-slide-next]", slider);
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === index);
            });
            thumbs.forEach(function (thumb, i) {
                thumb.classList.toggle("is-active", i === index);
            });
        }

        function play() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        thumbs.forEach(function (thumb) {
            thumb.addEventListener("click", function () {
                show(Number(thumb.getAttribute("data-slide-to")) || 0);
                play();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                play();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                play();
            });
        }
        play();
    }

    function initFilters() {
        qsa("[data-filter-scope]").forEach(function (scope) {
            var section = scope.parentElement;
            var input = qs("[data-filter-input]", scope);
            var year = qs("[data-filter-year]", scope);
            var region = qs("[data-filter-region]", scope);
            var category = qs("[data-filter-category]", scope);
            var cards = qsa(".movie-card, .rank-card", section);

            function filter() {
                var term = normalize(input && input.value);
                var yearValue = normalize(year && year.value);
                var regionValue = normalize(region && region.value);
                var categoryValue = normalize(category && category.value);
                cards.forEach(function (card) {
                    var haystack = normalize(card.getAttribute("data-search") || card.textContent);
                    var cardYear = normalize(card.getAttribute("data-year") || card.textContent);
                    var cardRegion = normalize(card.getAttribute("data-region") || card.textContent);
                    var cardCategory = normalize(card.getAttribute("data-category") || card.textContent);
                    var visible = true;
                    if (term && haystack.indexOf(term) === -1) {
                        visible = false;
                    }
                    if (yearValue && cardYear.indexOf(yearValue) === -1) {
                        visible = false;
                    }
                    if (regionValue && cardRegion.indexOf(regionValue) === -1) {
                        visible = false;
                    }
                    if (categoryValue && cardCategory.indexOf(categoryValue) === -1) {
                        visible = false;
                    }
                    card.classList.toggle("is-hidden-card", !visible);
                });
            }

            [input, year, region, category].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", filter);
                    control.addEventListener("change", filter);
                }
            });
        });
    }

    function movieCard(movie) {
        var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
            return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");
        return [
            "<article class=\"movie-card\">",
            "<a class=\"movie-cover\" href=\"./" + movie.file + "\" aria-label=\"" + escapeHtml(movie.title) + "\">",
            "<img src=\"" + movie.cover + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">",
            "<span class=\"cover-shade\"></span>",
            "<span class=\"play-dot\">▶</span>",
            "<span class=\"year-badge\">" + escapeHtml(movie.year) + "</span>",
            "</a>",
            "<div class=\"movie-card-body\">",
            "<h3><a href=\"./" + movie.file + "\">" + escapeHtml(movie.title) + "</a></h3>",
            "<p>" + escapeHtml(movie.oneLine || "") + "</p>",
            "<div class=\"card-meta\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span><span>" + escapeHtml(movie.score) + "</span></div>",
            "<div class=\"tag-row\">" + tags + "</div>",
            "</div>",
            "</article>"
        ].join("");
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function initSearchPage() {
        var page = qs("[data-search-page]");
        if (!page || !window.SITE_MOVIES) {
            return;
        }
        var input = qs("[data-search-input]", page);
        var button = qs("[data-search-button]", page);
        var region = qs("[data-search-region]", page);
        var year = qs("[data-search-year]", page);
        var category = qs("[data-search-category]", page);
        var results = qs("[data-search-results]", page);
        var status = qs("[data-search-status]", page);
        var params = new URLSearchParams(window.location.search);
        var initial = params.get("q") || "";
        if (input) {
            input.value = initial;
        }

        function render() {
            var term = normalize(input && input.value);
            var regionValue = normalize(region && region.value);
            var yearValue = normalize(year && year.value);
            var categoryValue = normalize(category && category.value);
            var filtered = window.SITE_MOVIES.filter(function (movie) {
                var haystack = normalize([movie.title, movie.region, movie.type, movie.year, movie.genre, movie.category, (movie.tags || []).join(" "), movie.oneLine].join(" "));
                if (term && haystack.indexOf(term) === -1) {
                    return false;
                }
                if (regionValue && normalize(movie.region).indexOf(regionValue) === -1) {
                    return false;
                }
                if (yearValue && normalize(movie.year).indexOf(yearValue) === -1) {
                    return false;
                }
                if (categoryValue && normalize(movie.category).indexOf(categoryValue) === -1) {
                    return false;
                }
                return true;
            });
            var shown = filtered.slice(0, 120);
            results.innerHTML = shown.map(movieCard).join("");
            status.textContent = filtered.length ? "已找到 " + filtered.length + " 部相关影片" : "没有找到匹配影片";
        }

        [input, region, year, category].forEach(function (control) {
            if (control) {
                control.addEventListener("input", render);
                control.addEventListener("change", render);
            }
        });
        if (button) {
            button.addEventListener("click", render);
        }
        render();
    }

    function initPlayers() {
        qsa("[data-player]").forEach(function (wrap) {
            var video = qs("video", wrap);
            var overlay = qs(".player-overlay", wrap);
            if (!video || !overlay) {
                return;
            }
            var stream = video.getAttribute("data-stream");
            var ready = false;
            var hlsInstance = null;

            function prepare() {
                if (ready || !stream) {
                    return;
                }
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = stream;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                    hlsInstance.loadSource(stream);
                    hlsInstance.attachMedia(video);
                } else {
                    video.src = stream;
                }
                ready = true;
            }

            function start() {
                prepare();
                overlay.classList.add("is-hidden");
                video.setAttribute("controls", "controls");
                var playPromise = video.play();
                if (playPromise && playPromise.catch) {
                    playPromise.catch(function () {});
                }
            }

            overlay.addEventListener("click", start);
            video.addEventListener("click", function () {
                if (video.paused) {
                    start();
                }
            });
            video.addEventListener("play", function () {
                overlay.classList.add("is-hidden");
            });
            window.addEventListener("beforeunload", function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    function initBackTop() {
        qsa("[data-back-top]").forEach(function (button) {
            button.addEventListener("click", function () {
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        initMenu();
        initHero();
        initFilters();
        initSearchPage();
        initPlayers();
        initBackTop();
    });
})();
