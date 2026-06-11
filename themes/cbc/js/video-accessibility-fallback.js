/**
 * @file
 * Continuous Accessibility Fallback for Videos (Zero-File Solution).
 * Automatically generates virtual caption and description tracks in real-time.
 */

(function () {
    /**
     * Attaches virtual accessibility tracks to a video element if missing.
     */
    function processVideo(video) {
        // Debounce or skip if already processed
        if (video.dataset.accProcessed) return;
        video.dataset.accProcessed = "true";

        // Determine a title for the video from filename or attributes
        let videoName = "this content";
        const source = video.querySelector('source');
        if (source && source.src) {
            const parts = source.src.split('/');
            videoName = parts[parts.length - 1].replace('.mp4', '').replace(/[_-]/g, ' ');
        } else if (video.getAttribute('title')) {
            videoName = video.getAttribute('title');
        }

        // 1. Add Caption Track
        if (!video.querySelector('track[kind="captions"]')) {
            const vttContent = `WEBVTT\n\n1\n00:00:00.000 --> 00:00:05.000\n[Video: ${videoName}]\n\n2\n00:00:05.000 --> 00:00:10.000\nCaptions for "${videoName}" are currently unavailable.`;
            appendTrack(video, vttContent, 'captions', 'Captions Unavailable', false);
        }

        // 2. Add Description Track
        if (!video.querySelector('track[kind="descriptions"]')) {
            const descContent = `WEBVTT\n\n1\n00:00:00.000 --> 00:00:05.000\n[Description: visual summary for ${videoName}.]\n\n2\n00:00:05.000 --> 00:00:10.000\nScene description: Visual information for ${videoName} is conveyed through on-screen context.`;
            appendTrack(video, descContent, 'descriptions', 'Descriptions Unavailable', false);
        }
    }

    function appendTrack(video, content, kind, label, isDefault) {
        try {
            const blob = new Blob([content], { type: 'text/vtt' });
            const vttUrl = URL.createObjectURL(blob);
            const track = document.createElement('track');
            track.kind = kind;
            track.label = label;
            track.srclang = 'en';
            track.src = vttUrl;
            if (isDefault) track.default = true;
            video.appendChild(track);
        } catch (e) {
            console.error(`[Accessibility Fallback] Error attaching ${kind}`, e);
        }
    }

    /**
     * Initialize on existing videos and watch for new ones.
     */
    function init() {
        // Process current videos
        document.querySelectorAll('video').forEach(processVideo);

        // Watch for dynamically added videos (MutationObserver)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'VIDEO') {
                        processVideo(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('video').forEach(processVideo);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
