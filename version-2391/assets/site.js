(function () {
  "use strict";

  var HLS_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
  var hlsScriptPromise = null;

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $all(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setupMenu() {
    var button = $(".menu-toggle");

    if (!button) {
      return;
    }

    button.addEventListener("click", function () {
      var isOpen = document.body.classList.toggle("nav-open");
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function setupHero() {
    var carousel = $("[data-hero-carousel]");

    if (!carousel) {
      return;
    }

    var slides = $all(".hero-slide", carousel);
    var dots = $all(".hero-dot", carousel);
    var prev = $("[data-hero-prev]", carousel);
    var next = $("[data-hero-next]", carousel);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
        dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        restart();
      });
    });

    carousel.addEventListener("mouseenter", function () {
      window.clearInterval(timer);
    });

    carousel.addEventListener("mouseleave", restart);

    show(0);
    restart();
  }

  function setupFilters() {
    $all("[data-filter-panel]").forEach(function (panel) {
      var root = panel.closest(".section") || document;
      var cards = $all(".movie-card", root);
      var input = $("[data-filter-input]", panel);
      var selects = $all("[data-filter-select]", panel);
      var reset = $("[data-filter-reset]", panel);
      var count = $("[data-filter-count]", panel);
      var noResults = $(".no-results", root);

      function cardMatches(card) {
        var query = normalize(input ? input.value : "");
        var searchText = normalize(card.getAttribute("data-search"));

        if (query && searchText.indexOf(query) === -1) {
          return false;
        }

        return selects.every(function (select) {
          var key = select.getAttribute("data-filter-select");
          var value = normalize(select.value);
          var cardValue = normalize(card.getAttribute("data-" + key));

          return !value || cardValue.indexOf(value) !== -1;
        });
      }

      function apply() {
        var visible = 0;

        cards.forEach(function (card) {
          var matched = cardMatches(card);
          card.classList.toggle("is-hidden", !matched);

          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = String(visible);
        }

        if (noResults) {
          noResults.classList.toggle("is-visible", visible === 0);
        }
      }

      if (input) {
        input.addEventListener("input", apply);

        var params = new URLSearchParams(window.location.search);
        var query = params.get("q");

        if (query) {
          input.value = query;
        }
      }

      selects.forEach(function (select) {
        select.addEventListener("change", apply);
      });

      if (reset) {
        reset.addEventListener("click", function () {
          if (input) {
            input.value = "";
          }

          selects.forEach(function (select) {
            select.value = "";
          });

          apply();
        });
      }

      apply();
    });
  }

  function loadHlsScript() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsScriptPromise) {
      return hlsScriptPromise;
    }

    hlsScriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");

      script.src = HLS_SCRIPT_URL;
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = function () {
        reject(new Error("HLS 播放内核加载失败"));
      };

      document.head.appendChild(script);
    });

    return hlsScriptPromise;
  }

  function setStatus(player, message) {
    var status = $(".player-status", player);

    if (status) {
      status.textContent = message;
    }
  }

  function playVideo(video) {
    var playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        setStatus(video.closest(".player-shell"), "浏览器阻止了自动播放，请再次点击播放按钮");
      });
    }
  }

  function setupPlayers() {
    $all(".player-shell").forEach(function (player) {
      var video = $("video", player);
      var cover = $(".player-cover", player);
      var source = player.getAttribute("data-src") || (video && video.getAttribute("data-src"));
      var started = false;

      if (!video || !source) {
        return;
      }

      function startPlayback() {
        if (started) {
          playVideo(video);
          return;
        }

        started = true;
        setStatus(player, "正在初始化播放线路…");

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          player.classList.add("is-playing");
          setStatus(player, "已启用浏览器原生 HLS 播放");
          playVideo(video);
          return;
        }

        loadHlsScript()
          .then(function (Hls) {
            if (!Hls || !Hls.isSupported()) {
              throw new Error("当前浏览器暂不支持 HLS 播放");
            }

            var hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false
            });

            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
              player.classList.add("is-playing");
              setStatus(player, "播放线路已就绪");
              playVideo(video);
            });
            hls.on(Hls.Events.ERROR, function (_, data) {
              if (data && data.fatal) {
                setStatus(player, "播放线路异常，请刷新后重试");
              }
            });
          })
          .catch(function (error) {
            started = false;
            setStatus(player, error.message || "播放初始化失败");
          });
      }

      if (cover) {
        cover.addEventListener("click", startPlayback);
      }

      video.addEventListener("play", function () {
        player.classList.add("is-playing");
      });
    });
  }

  function setupHomeSearch() {
    $all("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var input = $("input[type='search']", form);
        var query = input ? input.value.trim() : "";
        var action = form.getAttribute("action") || "movies.html";
        var target = query ? action + "?q=" + encodeURIComponent(query) : action;

        window.location.href = target;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayers();
    setupHomeSearch();
  });
})();
