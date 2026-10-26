# Moo preview choices

Each GIF is a five-second, 1920 × 1080 capture of the actual Moo interface, recorded offscreen at 20 fps and encoded as a looping 10 fps GIF. The mail, people, events, tasks and weather are fictional demo data. No Google account was connected. The video is real stock footage; the interface is not an image mockup.

| Variant | GIF | Source footage |
| --- | --- | --- |
| Forest glide | [Open GIF](moo-forest.gif) | [The camera slowly slides into the tranquil forest on a sunny day](https://mixkit.co/free-stock-video/the-camera-slowly-slides-into-the-tranquil-forest-on-a-50847/) |
| Alpine clouds — selected README preview | [Open GIF](moo-clouds.gif) | [Mountainous area in the Alps](https://mixkit.co/free-stock-video/mountainous-area-in-the-alps-4132/) |
| Sunlit trees | [Open GIF](moo-meadow.gif) | [Meadow covered with grass and trees in the blazing sun](https://mixkit.co/free-stock-video/meadow-covered-with-grass-and-trees-in-the-blazing-sun-40657/) — cropped to fill the widescreen page |

The source pages identify these clips with the [Mixkit Stock Video Free License](https://mixkit.co/license/#videoFree). Credits are retained here. The footage is used in a rendered product demonstration; original stock files are not packaged with the extension.

The GIFs retain Full HD dimensions and therefore have large file sizes. The [original comparison image](choices.jpg) shows the three options before selection. Alpine clouds was selected and is copied to `assets/moo-newtab.gif`, preserving the existing README image path. To choose another, replace that file with the selected GIF.

To reproduce the scene, start the local Vite server on port 5173, use a new disposable Playwright CLI session at 1920 × 1080 and load `scripts/capture-demo.playwright` with `run-code --filename`. That script seeds only the disposable capture profile and intercepts external requests with demo responses. Put licensed source clips in `output/playwright/media/forest.mp4`, `clouds.mp4` and `meadow.mp4`. Use `video-start ... --size 1920x1080 --fps 20`, record at least five seconds and `video-stop`. Encode the first five seconds with FFmpeg using `fps=10`, `palettegen=max_colors=96:stats_mode=diff` and `paletteuse=dither=none:diff_mode=rectangle`. All working video files stay in the ignored `output/playwright/` directory.
