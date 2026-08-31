# Menu Select Project

A simple front-end project using plain HTML, CSS, and JavaScript.

## Prerequisites

- A modern web browser (Chrome, Edge, Firefox, or Safari)
- Optional: Python 3 (only needed if you want to run a local server)

## Run Locally

### Option 1: Open directly in browser

1. In Finder or your editor, open this project folder.
2. Double-click `index.html`.
3. The app will open in your default browser.

### Option 2: Run with a local server (recommended)

From the project root, run:

```bash
python3 -m http.server 8000
```

Then open:

- http://localhost:8000

## Project Structure

- `index.html` - page markup
- `style.css` - styling
- `script.js` - interaction logic
- `test/` - unit tests
- `images/` - image assets

## Run Tests

Tests use Node's built-in test runner. Install dependencies once, then run:

```bash
npm install
npm test
```

- `test/core.test.js` - unit tests for pure helper functions (no DOM required).
- `test/submit.test.js` - integration tests that fill the booking form and exercise the email and WhatsApp submission logic using jsdom.

## Menu History Videos

Add a `HistoryVideoURL` column to the published Google Sheet for any dish with
an origin-story video. The value can be a YouTube Shorts URL, a standard
YouTube watch URL, a short `youtu.be` URL, or an 11-character YouTube video ID.
Rows without a value do not display the video button.

## Languages

Use the language selector in the app to switch between English and Traditional
Chinese-HK. The Chinese menu fields are read from `NameZh`, `DescriptionZh`,
`AdditionalRemarksZh`, and `WinePairingRationaleZh`. If a Chinese value is
blank, that individual field falls back to its English counterpart.

## GitHub Pages Deployment

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` generates
`version.json` during each deployment. The footer displays the resulting
release version in the format `Release: YYYY.MM.DD-<short-commit-id>`.
For example: `Release: 2026.08.24-abc1234`.

In the repository settings, set **Pages > Build and deployment > Source** to
**GitHub Actions**. Opening the app directly from `index.html` will show
`Release: unavailable` because `version.json` is created during deployment.

## Stop the Local Server

Press `Ctrl + C` in the terminal where the server is running.

## Troubleshooting

- **Port 8000 is already in use**
	- Start the server on a different port:

	```bash
	python3 -m http.server 8080
	```

	- Then open `http://localhost:8080`.

- **`python3: command not found`**
	- Install Python 3, or use another local server tool (for example, VS Code Live Server).

- **Page looks outdated after edits**
	- Refresh the browser (`Cmd + Shift + R`) to bypass cache.

- **Images are not loading**
	- Make sure image files are inside the `images/` folder and paths in `index.html` match filenames exactly.
