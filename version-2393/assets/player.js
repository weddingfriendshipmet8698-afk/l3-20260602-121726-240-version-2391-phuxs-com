(function () {
  window.initMoviePlayer = function (streamUrl) {
    var box = document.querySelector('[data-player]');
    if (!box) {
      return;
    }
    var video = box.querySelector('video');
    var cover = box.querySelector('[data-play-cover]');
    var button = box.querySelector('[data-play-button]');
    var started = false;
    var hls = null;

    function start() {
      if (!video || started) {
        return;
      }
      started = true;
      box.classList.add('is-playing');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.play().catch(function () {});
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        return;
      }

      video.src = streamUrl;
      video.play().catch(function () {});
    }

    if (button) {
      button.addEventListener('click', start);
    }
    if (cover) {
      cover.addEventListener('click', start);
    }
    if (video) {
      video.addEventListener('click', function () {
        if (!started) {
          start();
        }
      });
    }
    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  };
})();
