(function () {
    var shell = document.querySelector('[data-player-shell]');
    var button = document.querySelector('[data-player-button]');
    var video = document.querySelector('.movie-video');

    if (!shell || !button || !video) {
        return;
    }

    var stream = video.getAttribute('data-stream');
    var ready = false;
    var hls = null;

    function prepareVideo() {
        if (ready || !stream) {
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: false
            });
            hls.loadSource(stream);
            hls.attachMedia(video);
        } else {
            video.src = stream;
        }

        ready = true;
    }

    function playVideo() {
        prepareVideo();
        button.classList.add('hidden');
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {
                button.classList.remove('hidden');
            });
        }
    }

    button.addEventListener('click', function (event) {
        event.stopPropagation();
        playVideo();
    });

    shell.addEventListener('click', function (event) {
        if (event.target === video && ready) {
            return;
        }
        playVideo();
    });

    video.addEventListener('play', function () {
        button.classList.add('hidden');
    });

    video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
            button.classList.remove('hidden');
        }
    });

    window.addEventListener('beforeunload', function () {
        if (hls) {
            hls.destroy();
        }
    });
})();
