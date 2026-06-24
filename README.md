# Electron Code Editor (Week 1 Setup)

A desktop code editor app built with Electron.

## Features (Week 1)
- Scaffolded repository with proper `.gitignore` and `package.json` configurations.
- Main process file (`main.js`) setup to initialize the desktop app window.
- Premium dark-themed renderer view (`index.html`, `style.css`) with smooth animations and clean design displaying **"Hello Editor"**.

---

## Getting Started

Follow these steps in your terminal to set up and run the application locally:

### 1. Install Dependencies
Ensure you have [Node.js](https://nodejs.org/) installed, then run:
```bash
npm install
```
This will install Electron and resolve all required developer dependencies.

### 2. Start the Application
Run the start script to launch the Electron window:
```bash
npm start
```

---

## Project Structure
- `main.js` - Main Electron process code that configures and manages the desktop window.
- `index.html` - Renderer window view displaying the UI.
- `style.css` - Custom styling rules for the UI using a modern design system.
- `package.json` - Node project descriptor with dependencies and start scripts.
- `.gitignore` - Standard ignore configuration to keep repository commits clean.
