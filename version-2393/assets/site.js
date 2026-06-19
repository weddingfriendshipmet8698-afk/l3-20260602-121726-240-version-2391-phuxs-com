(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var navLinks = document.querySelector('[data-nav-links]');

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', function () {
      navLinks.classList.toggle('is-open');
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-site-search]')).forEach(function (form) {
    form.addEventListener('submit', function (event) {
      var input = form.querySelector('input[name="q"]');
      if (!input || !input.value.trim()) {
        event.preventDefault();
        input && input.focus();
      }
    });
  });

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var current = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]')).forEach(function (panel) {
    var input = panel.querySelector('[data-filter-input]');
    var region = panel.querySelector('[data-filter-region]');
    var type = panel.querySelector('[data-filter-type]');
    var year = panel.querySelector('[data-filter-year]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-text]'));
    var empty = document.querySelector('[data-filter-empty]');

    function fill(select, attr) {
      if (!select) {
        return;
      }
      var values = cards.map(function (card) {
        return card.getAttribute(attr) || '';
      }).filter(Boolean).filter(function (value, index, list) {
        return list.indexOf(value) === index;
      }).sort(function (a, b) {
        return String(b).localeCompare(String(a), 'zh-CN');
      });
      values.forEach(function (value) {
        var option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    fill(region, 'data-region');
    fill(type, 'data-type');
    fill(year, 'data-year');

    function apply() {
      var q = normalize(input && input.value);
      var r = region && region.value;
      var t = type && type.value;
      var y = year && year.value;
      var shown = 0;

      cards.forEach(function (card) {
        var text = normalize(card.getAttribute('data-search-text'));
        var ok = (!q || text.indexOf(q) !== -1) && (!r || card.getAttribute('data-region') === r) && (!t || card.getAttribute('data-type') === t) && (!y || card.getAttribute('data-year') === y);
        card.classList.toggle('is-hidden', !ok);
        if (ok) {
          shown += 1;
        }
      });

      if (empty) {
        empty.style.display = shown ? 'none' : 'block';
      }
    }

    [input, region, type, year].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });
  });

  var resultWrap = document.querySelector('[data-search-results]');
  if (resultWrap && window.SEARCH_DATA) {
    var params = new URLSearchParams(window.location.search);
    var q = normalize(params.get('q') || '');
    var note = document.querySelector('[data-search-note]');
    var matches = window.SEARCH_DATA.filter(function (item) {
      return !q || normalize(item.title + item.region + item.type + item.year + item.genre + item.tags).indexOf(q) !== -1;
    }).slice(0, 180);

    if (note) {
      note.textContent = q ? '搜索结果：' + params.get('q') : '输入关键词可检索片名、地区、类型、年份和标签';
    }

    resultWrap.innerHTML = matches.map(function (item) {
      return '<article class="movie-card">' +
        '<a class="poster-link" href="' + item.url + '" aria-label="' + escapeHtml(item.title) + '">' +
        '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
        '<span class="poster-badge">' + escapeHtml(item.year || item.type) + '</span>' +
        '</a>' +
        '<div class="card-body">' +
        '<div class="meta-line"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>' +
        '<h3><a href="' + item.url + '">' + escapeHtml(item.title) + '</a></h3>' +
        '<p>' + escapeHtml(item.oneLine) + '</p>' +
        '<div class="tag-row"><span>' + escapeHtml(item.genre) + '</span></div>' +
        '</div>' +
        '</article>';
    }).join('');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }
})();
