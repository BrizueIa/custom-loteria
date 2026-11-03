<p align="center">
  <h1 align="center">🌱 Custom Lotería</h1>
  <p align="center">
    <em>Customizable Mexican Lotería board game generator and digital caller built for web and print.</em>
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

---

## ⚡ Highlights

* **🎙️ Interactive Digital Caller (*El Cantador*):** 
  Fully featured caller engine with auto-shuffle, adjustable timer intervals, voice narration, Mexican lottery rhymes/taglines, live history of called cards, and confetti celebrations.
* **🖨️ Printable Board Generator (*Tablas a PDF*):** 
  Algorithmic generation of randomized, unique game boards (4x4 grids or custom sizes) with duplication prevention. Export directly to print-ready high-resolution PDFs using `jsPDF` and `html2canvas`.
* **🎨 Visual Customization Studio:** 
  Fine-tune frame styles (Botanical Lithography, Classic), card background colors, borders, typography (Serif, Sans, Display), and text positioning.
* **🃏 Card Editor & Deck Manager:** 
  Inspect, tweak, and edit card details including numbers, names, subtitles, and traditional rhymes/sayings with both grid and swipe-based editors.
* **🔒 Host Lock & PIN Security:** 
  Lock down the generator and settings with an admin PIN, leaving an uncluttered, tamper-proof standalone interface for game hosts and players.
* **🌿 Preloaded Botanical Edition (*Señora de las Plantas*):** 
  Comes out-of-the-box with a complete 54-card deck themed around indoor plants, botanical illustrations, and plant-care humor.

---

## 🏛️ Architecture & Stack

* **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite 6](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Typography:** Google Fonts (*Cinzel*, *Playfair Display*, *Plus Jakarta Sans*)
* **Document Generation:** [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
* **Visual Effects & Icons:** [canvas-confetti](https://www.kirilv.com/canvas-confetti/) & [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* `npm`, `pnpm`, or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BrizueIa/custom-loteria.git
   cd custom-loteria
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173` (or the URL shown in your terminal).

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles TypeScript and builds production-optimized assets in `dist/`. |
| `npm run preview` | Locally serves the production build for verification. |

---

## 📜 Architecture, Governance & Policies

* **[ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)**: Full system architecture, board generation algorithm, and audio caller pipeline.
* **[SECURITY.md](.github/SECURITY.md)**: Vulnerability disclosure procedure and security policy.
* **[CONTRIBUTING.md](.github/CONTRIBUTING.md)**: Guidelines for contributing code, custom decks, and bug reports.

---

## 🎯 Project Structure

```text
custom-loteria/
├── .github/                # CI Quality Gates & GitHub templates
│   ├── workflows/ci.yml    # Build & Typecheck CI pipeline
│   ├── ISSUE_TEMPLATE/     # Bug report & Feature request templates
│   ├── CONTRIBUTING.md     # Development & contribution guide
│   ├── pull_request_template.md
│   └── SECURITY.md         # Vulnerability reporting policy
├── docs/                   # Technical documentation
│   └── architecture/       # Architecture specification
├── public/                 # Static assets, sounds & voice clips
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── BoardGeneratorSettings.tsx  # Board layout & PDF generation
│   │   ├── CantadorView.tsx            # Digital caller game screen
│   │   ├── CardPreview.tsx             # Card renderer & style application
│   │   ├── CardsGridView.tsx           # Multi-card deck visualizer
│   │   ├── CardStyleSelector.tsx       # Frame, border, and font controls
│   │   ├── GeneratorView.tsx           # Management & board builder layout
│   │   ├── Header.tsx                  # Top navigation & host security
│   │   ├── PasswordModal.tsx           # Host PIN verification modal
│   │   └── SwipeCardEditor.tsx         # Card-by-card inspector
│   ├── data/
│   │   └── plantasDefault.ts           # 54-card "Señora de las Plantas" dataset
│   ├── types/
│   │   └── loteria.ts                  # TypeScript models & config interfaces
│   ├── utils/              # Helper utilities and storage management
│   ├── App.tsx             # Main application orchestrator & state
│   ├── main.tsx            # React root mount
│   └── index.css           # Tailwind base layers and font styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts          # Consolidated Vite + Tailwind + PostCSS config
```

---

## 📄 License

Licensed under the **Apache License, Version 2.0**. See the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for details.

Copyright © 2026 Brizuela.
