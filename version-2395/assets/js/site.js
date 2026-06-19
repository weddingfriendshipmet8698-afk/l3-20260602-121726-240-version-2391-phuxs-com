(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-lead-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-lead-dot]'));

  if (slides.length > 1) {
    var activeIndex = 0;

    function showSlide(index) {
      activeIndex = index;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
      });
    });

    window.setInterval(function () {
      showSlide((activeIndex + 1) % slides.length);
    }, 5200);
  }

  var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

  players.forEach(function (player) {
    var video = player.querySelector('video');
    var cover = player.querySelector('[data-player-cover]');
    var button = player.querySelector('[data-play-button]');
    var ready = false;
    var hls = null;

    if (!video || !cover || !button) {
      return;
    }

    function attachStream() {
      if (ready) {
        return;
      }

      var streamUrl = video.getAttribute('data-stream');

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else {
        video.src = streamUrl;
      }

      ready = true;
    }

    function startVideo() {
      attachStream();
      cover.classList.add('is-hidden');
      video.controls = true;
      var playResult = video.play();

      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(function () {});
      }
    }

    button.addEventListener('click', startVideo);
    cover.addEventListener('click', startVideo);
    video.addEventListener('click', function () {
      if (video.paused) {
        startVideo();
      }
    });

    window.addEventListener('pagehide', function () {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
    });
  });
})();
