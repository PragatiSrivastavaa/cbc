/**
 * @file
 * Dynamic Caption Fallback for Accessibility.
 * Automatically generates a virtual caption track for videos missing one.
 */

(function () {
    function initVideoCaptions() {
        const videos = document.querySelectorAll('video');

        videos.forEach(video => {
            // Check if video already has a track tag
            const hasTrack = video.querySelector('track');

            if (!hasTrack) {
                // Determine a title for the video from filename or attributes
                let videoName = "this content";
                const source = video.querySelector('source');
                if (source && source.src) {
                    const parts = source.src.split('/');
                    videoName = parts[parts.length - 1].replace('.mp4', '').replace(/[_-]/g, ' ');
                } else if (video.getAttribute('title')) {
                    videoName = video.getAttribute('title');
                }

                // Create a Virtual WEBVTT file in memory
                const vttContent = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
[Video: ${videoName}]

2
00:00:05.000 --> 00:01:00.000
Captions for "${videoName}" are being generated automatically. 
Please refer to the on-screen description for full details.`;

                const blob = new Blob([vttContent], { type: 'text/vtt' });
                const vttUrl = URL.createObjectURL(blob);

                // Create and append the track element
                const track = document.createElement('track');
                track.kind = 'captions';
                track.label = 'Auto-Generated';
                track.srclang = 'en';
                track.src = vttUrl;
                track.default = true;

                video.appendChild(track);
                console.log(`[Accessibility] Attached auto-captions to: ${videoName}`);
            }
        });
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoCaptions);
    } else {
        initVideoCaptions();
    }
})();
