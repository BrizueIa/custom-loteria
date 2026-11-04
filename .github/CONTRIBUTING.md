# Contributing to Custom Lotería

Thank you for your interest in contributing to **Custom Lotería**! We welcome community contributions, bug reports, feature enhancements, and new custom deck themes.

---

## Code of Conduct

Please maintain a welcoming, respectful, and constructive environment in all issues, discussions, and pull requests.

---

## 🛠️ Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v20.0.0 or v22.0.0+ recommended)
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
4. Run the automated unit & integration test suite (Vitest):
   ```bash
   npm test
   ```
5. Run typechecking and production build verification:
   ```bash
   npm run build
   ```

---

## 🌿 Creating or Adding New Decks

If you are contributing a new preset deck theme:
1. Define the 54-card array under `src/data/<yourTheme>Default.ts` implementing `LoteriaCard[]`.
2. Ensure each card contains `id`, `number` (1–54), `name`, `image` (SVG data URL or optimized image), and a traditional or custom `tagline`.
3. Add unit tests under `src/data/__tests__/` verifying card count, sequential numbering, and non-empty fields.

---

## 🚀 Submitting Pull Requests

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit changes using clear, concise commit messages (Conventional Commits preferred).
3. Verify that both `npm test` and `npm run build` succeed without errors.
4. Push your branch and open a Pull Request describing your changes and verification steps.
