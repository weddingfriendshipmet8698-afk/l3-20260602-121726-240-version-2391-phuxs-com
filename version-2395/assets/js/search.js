(function () {
  var input = document.getElementById('searchInput');
  var form = document.getElementById('searchForm');
  var output = document.getElementById('searchResults');
  var summary = document.getElementById('searchSummary');
  var params = new URLSearchParams(window.location.search);
  var initialQuery = params.get('q') || '';
  var movies = window.STATIC_MOVIES || [];

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function card(movie) {
    var title = escapeHtml(movie.title);
    var file = escapeHtml(movie.file);
    var cover = escapeHtml(movie.cover);
    var year = escapeHtml(movie.year);
    var region = escapeHtml(movie.region);
    var type = escapeHtml(movie.type);
    var oneLine = escapeHtml(movie.oneLine);

    return [
      '<article class="movie-card">',
      '  <a class="poster-link" href="' + file + '" aria-label="' + title + '">',
      '    <img src="' + cover + '" alt="' + title + '" loading="lazy">',
      '    <span class="poster-glow"></span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <div class="movie-meta-line">',
      '      <span>' + year + '</span>',
      '      <span>' + region + '</span>',
      '      <span>' + type + '</span>',
      '    </div>',
      '    <h3><a href="' + file + '">' + title + '</a></h3>',
      '    <p>' + oneLine + '</p>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function render() {
    var query = normalize(input.value);
    var words = query.split(/\s+/).filter(Boolean);
    var results = movies.filter(function (movie) {
      if (!words.length) {
        return true;
      }

      var text = normalize([
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.tags,
        movie.oneLine
      ].join(' '));

      return words.every(function (word) {
        return text.indexOf(word) !== -1;
      });
    }).slice(0, 160);

    output.innerHTML = results.map(card).join('');

    if (summary) {
      summary.textContent = query ? '与“' + input.value + '”相关的影片' : '近期精选影片';
    }
  }

  if (input && output) {
    input.value = initialQuery;
    render();
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var query = input.value.trim();
      var nextUrl = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
      window.history.replaceState(null, '', nextUrl);
      render();
    });
  }
})();
