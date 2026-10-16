# Nova — 3D Animated Website

A small, fully self-contained 3D website built with **Three.js**. The library is
loaded from a CDN, so there is no build step — just HTML, CSS, and JavaScript.

## Run it

Double-click `index.html` in any modern browser (Chrome, Edge, Firefox, or
Safari).

If your browser blocks the CDN request, serve the folder instead and visit the
shown URL:

```
python -m http.server 8080
```

Then open <http://localhost:8080>.

## What you can do

- **Move your mouse** to steer the camera around the planet.
- **Click** anywhere in the scene to spawn a burst of light.
- **Scroll** to see the feature cards, which fade in as you read.

## Files

- `index.html` — page structure and the UI overlay.
- `style.css` — dark theme, hero, and feature cards.
- `app.js` — the Three.js scene: starfield, morphing planet, camera, bursts.
