# PDF Fusion 📄⚡

Welcome to **PDF Fusion**, a fast, secure, and intuitive web application to merge multiple PDF files seamlessly.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

## ✨ Features

- **Client-Side Processing:** All PDF merging is performed entirely within your web browser using [`pdf-lib`](https://pdf-lib.js.org/). No files are ever uploaded or transmitted to an external server, guaranteeing maximum privacy and security for your sensitive documents.
- **Drag-and-Drop Reordering:** An intuitive interface lets you easily reorder the sequence of your PDF files before merging them using Framer Motion animations.
- **Source Viewer:** Transparency is key! PDF Fusion includes an integrated source code viewer (accessible right from the UI) that allows you to explore the application's underlying code in real-time.
- **Fast and Modern:** Built with React, Vite, and styled neatly with Tailwind CSS for exceptional performance and a great user experience.

## 🛠️ How It Works

1. **Frontend**: The user interface relies on React to handle state (like file selection and reordering). 
2. **Merging**: When you choose to merge your files, `pdf-lib` reads the uploaded files as ArrayBuffers, creates a new blank PDF Document, iterates over each imported PDF, copies over all pages, and adds them to the new unified document. The final file is presented as a blob URL for an instant download.
3. **Backend Source Viewer**: An Express.js server runs alongside local development (and in production) strictly to expose read-only `/api/files` and `/api/file-content` routes. This purely powers the integrated "SourceViewer" component so you can easily browse the directory and read the project code while looking at the app.

---

## 🚀 Run Your Own Version

Want to contribute, learn, or deploy your own instance of PDF Fusion? Follow these steps to get started locally:

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (comes with Node.js) or `yarn` / `pnpm`
- Git

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/krishcshah/pdf-fusion.git
   ```

2. **Navigate into the project directory:**
   ```bash
   cd pdf-fusion
   ```

3. **Install the dependencies:**
   ```bash
   npm install
   ```

4. **Environment Variables (Optional):**
   Copy the `.env.example` file to create your own localized `.env.local` if you plan on adding AI integrations or modifications. (Default functionality works without this step).
   ```bash
   cp .env.example .env.local
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **View the app:**
   Open your browser and navigate to `http://localhost:3000` (or the port specified in your terminal output) to use PDF Fusion!

## 📜 Scripts

- `npm run dev`: Starts the local Express/Vite server for development.
- `npm run build`: Compiles TypeScript and creates an optimized production build using Vite.
- `npm run preview`: Bootstraps a local server to preview the production build.
- `npm run lint`: Analyzes the code for errors (runs `tsc --noEmit`).
- `npm run clean`: Cleans up the `dist` directory.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/krishcshah/pdf-fusion/issues).

---
<div align="center">
  <i>Built with ❤️ using React, Express, and pdf-lib.</i>
</div>