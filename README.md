# Map Levels for Owlbear Rodeo

A small Owlbear Rodeo extension that lets you create multiple map levels inside one scene.

## What it does

- Create named levels like `Basement`, `Ground Floor`, and `Roof`
- Assign selected scene items to a level
- Show one level at a time by toggling item visibility
- Store level data in scene metadata so it stays with the scene

## Suggested setup

1. Add each floor's map image to the same Owlbear scene
2. Add tokens, props, notes, and walls for that floor
3. Select the items for one floor
4. Assign them to a level in the extension
5. Repeat for the other floors
6. Use **Show** to switch floors during play

## Local development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Then install this manifest in Owlbear Rodeo:

```text
http://localhost:5173/manifest.json
```

## GitHub Pages deployment

This project is preconfigured for GitHub Pages with a GitHub Actions workflow.

### Important

The current `vite.config.js` is set for a repository named:

```text
owlbear-map-levels
```

If you use a different repository name, update this line in `vite.config.js`:

```js
base: '/owlbear-map-levels/'
```

### Publish steps

1. Create a **public** GitHub repository.
2. Upload all project files to that repository.
3. In GitHub, open **Settings → Pages**.
4. Under **Source**, choose **GitHub Actions**.
5. Push to the `main` branch.
6. Wait for the workflow to finish.
7. Your site URL will be:

```text
https://YOUR-USERNAME.github.io/owlbear-map-levels/
```

8. Install this manifest URL in Owlbear Rodeo:

```text
https://YOUR-USERNAME.github.io/owlbear-map-levels/manifest.json
```

## Manual production build

```bash
npm install
npm run build
```

The built site will be in:

```text
dist/
```
