document.addEventListener("DOMContentLoaded", function () {
  setupMenu();
  setupHero();
  setupFilters();
  setupPlayer();
});

function setupMenu() {
  var button = document.querySelector(".menu-toggle");
  var panel = document.querySelector(".mobile-panel");
  if (!button || !panel) {
    return;
  }

  button.addEventListener("click", function () {
    var open = panel.hasAttribute("hidden");
    if (open) {
      panel.removeAttribute("hidden");
    } else {
      panel.setAttribute("hidden", "");
    }
    button.setAttribute("aria-expanded", String(open));
  });
}

function setupHero() {
  var hero = document.querySelector("[data-hero]");
  if (!hero) {
    return;
  }

  var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
  var prev = hero.querySelector("[data-hero-prev]");
  var next = hero.querySelector("[data-hero-next]");
  var index = 0;
  var timer = null;

  function show(target) {
    if (!slides.length) {
      return;
    }
    index = (target + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === index);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === index);
    });
  }

  function start() {
    if (slides.length <= 1) {
      return;
    }
    stop();
    timer = window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  if (prev) {
    prev.addEventListener("click", function () {
      show(index - 1);
      start();
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      show(index + 1);
      start();
    });
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      show(i);
      start();
    });
  });

  hero.addEventListener("mouseenter", stop);
  hero.addEventListener("mouseleave", start);
  show(0);
  start();
}

function setupFilters() {
  var forms = Array.prototype.slice.call(document.querySelectorAll("[data-filter-form]"));
  forms.forEach(function (form) {
    var list = form.parentElement.querySelector("[data-filter-list]");
    if (!list) {
      return;
    }

    var items = Array.prototype.slice.call(list.querySelectorAll(".movie-card, .rank-card"));
    var input = form.querySelector(".filter-input");
    var year = form.querySelector(".filter-year");
    var category = form.querySelector(".filter-category");
    var years = [];

    items.forEach(function (item) {
      var itemYear = item.getAttribute("data-year") || "";
      if (itemYear && years.indexOf(itemYear) === -1) {
        years.push(itemYear);
      }
    });

    years.sort(function (a, b) {
      return String(b).localeCompare(String(a), "zh-Hans-CN");
    });

    if (year) {
      years.forEach(function (itemYear) {
        var option = document.createElement("option");
        option.value = itemYear;
        option.textContent = itemYear;
        year.appendChild(option);
      });
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    if (query && input) {
      input.value = query;
    }

    function apply() {
      var text = input ? input.value.trim().toLowerCase() : "";
      var selectedYear = year ? year.value : "";
      var selectedCategory = category ? category.value : "";

      items.forEach(function (item) {
        var haystack = [
          item.getAttribute("data-title") || "",
          item.getAttribute("data-region") || "",
          item.getAttribute("data-year") || "",
          item.getAttribute("data-tags") || ""
        ].join(" ").toLowerCase();
        var passText = !text || haystack.indexOf(text) !== -1;
        var passYear = !selectedYear || item.getAttribute("data-year") === selectedYear;
        var passCategory = !selectedCategory || haystack.indexOf(selectedCategory.toLowerCase()) !== -1;
        item.classList.toggle("is-filter-hidden", !(passText && passYear && passCategory));
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      apply();
    });

    [input, year, category].forEach(function (control) {
      if (control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      }
    });

    apply();
  });
}

function setupPlayer() {
  var video = document.querySelector(".movie-player[data-stream]");
  if (!video) {
    return;
  }

  var overlay = document.querySelector(".play-overlay");
  var stream = video.getAttribute("data-stream");
  var attached = false;
  var hlsInstance = null;

  function attachStream() {
    if (attached || !stream) {
      return;
    }
    attached = true;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(stream);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
        var nextPlay = video.play();
        if (nextPlay && typeof nextPlay.catch === "function") {
          nextPlay.catch(function () {});
        }
      });
      hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hlsInstance.startLoad();
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hlsInstance.recoverMediaError();
        }
      });
      return;
    }

    video.src = stream;
  }

  function playVideo() {
    attachStream();
    if (overlay) {
      overlay.classList.add("is-hidden");
    }
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {});
    }
  }

  if (overlay) {
    overlay.addEventListener("click", playVideo);
  }

  video.addEventListener("click", function () {
    if (!attached || video.paused) {
      playVideo();
    }
  });

  video.addEventListener("play", function () {
    if (overlay) {
      overlay.classList.add("is-hidden");
    }
  });

  window.addEventListener("beforeunload", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}
