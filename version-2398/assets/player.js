(function () {
    function initPlayer(shell) {
        var video = shell.querySelector('.video-player');
        var playButton = shell.querySelector('[data-player-play]');
        var message = shell.querySelector('[data-player-message]');
        var source = shell.dataset.videoUrl;
        var hlsInstance = null;
        var hasAttachedSource = false;

        if (!video || !playButton || !source) {
            return;
        }

        function setMessage(text, visible) {
            if (!message) {
                return;
            }

            message.textContent = text;
            message.hidden = !visible;
        }

        async function attachSource() {
            if (hasAttachedSource) {
                return;
            }

            hasAttachedSource = true;
            setMessage('正在加载 HLS 播放源...', true);

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                setMessage('播放源已就绪', false);
                return;
            }

            try {
                var module = await import('./hls.js');
                var Hls = module.H || module.default || window.Hls;

                if (Hls && Hls.isSupported()) {
                    hlsInstance = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                        setMessage('播放源已就绪', false);
                    });
                    hlsInstance.on(Hls.Events.ERROR, function (event, data) {
                        if (!data || !data.fatal) {
                            return;
                        }

                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            setMessage('网络异常，正在重新加载...', true);
                            hlsInstance.startLoad();
                        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            setMessage('媒体异常，正在尝试恢复...', true);
                            hlsInstance.recoverMediaError();
                        } else {
                            setMessage('当前浏览器无法播放该 HLS 源。', true);
                            hlsInstance.destroy();
                        }
                    });
                } else {
                    setMessage('当前浏览器不支持 HLS 播放。', true);
                }
            } catch (error) {
                setMessage('播放器加载失败，请刷新页面重试。', true);
                hasAttachedSource = false;
            }
        }

        async function playVideo() {
            await attachSource();

            try {
                await video.play();
                playButton.classList.add('is-hidden');
                setMessage('', false);
            } catch (error) {
                setMessage('请再次点击播放按钮开始播放。', true);
            }
        }

        playButton.addEventListener('click', playVideo);
        video.addEventListener('play', function () {
            playButton.classList.add('is-hidden');
        });
        video.addEventListener('pause', function () {
            if (!video.ended) {
                playButton.classList.remove('is-hidden');
            }
        });
        video.addEventListener('ended', function () {
            playButton.classList.remove('is-hidden');
        });
        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.player-shell').forEach(initPlayer);
    });
})();
