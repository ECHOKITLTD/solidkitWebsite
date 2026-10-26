# Solidkit website

Static files for [solidkit.co.uk](https://www.solidkit.co.uk/), hosted with GitHub Pages.

## Local preview

Run a static web server from the repository root, for example:

```sh
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/>.

## Local assets

Images, documents, fonts, and videos used by the site are stored under
`assets/content`. `assets/content-manifest.json` records the original source URL
for each mirrored file.

The product and case-study galleries use `assets/js/gallery.js`; they no longer
depend on Duda's retired `runtime-react.js` bundle. The homepage background video
is initialized by `assets/js/hero-video.js` so the legacy runtime cannot remove
it during startup.

To refresh recoverable content assets from their original source URLs, run:

```sh
node tools/mirror-content-assets.mjs
```
