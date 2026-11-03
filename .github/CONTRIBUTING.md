# Contributing to Custom Lotería

Thank you for your interest in contributing to **Custom Lotería**! We welcome community contributions, bug reports, feature enhancements, and new custom deck themes.

---

## Code of Conduct

Please maintain a welcoming, respectful, and constructive environment in all issues, discussions, and pull requests.

---

## 🛠️ Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [npm](https://www.npmjs.com/) (v9+)

### Local Workflow
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/custom-loteria.git
   cd custom-loteria
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Run typechecking and production build verification:
   ```bash
   npm run build
   ```

---

## 🌿 Creating or Adding New Decks

If you are contributing a new preset deck theme:
1. Define the cards array under `src/data/<yourTheme>Default.ts` implementing `LoteriaCard[]`.
2. Ensure each card contains `id`, `number`, `name`, `scientificName` or subtitle, and a witty `tagline`.
3. Provide card illustration assets under `public/images/` or as inline SVGs / optimized data URLs.

---

## 🚀 Submitting Pull Requests

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit changes using clear, concise commit messages.
3. Verify that `npm run build` succeeds without TypeScript or Vite errors.
4. Push your branch and open a Pull Request describing your changes and testing steps.
