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
- `images/` - image assets

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
