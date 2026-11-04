# Architecture Specification & System Design

**Project:** Custom Lotería (Customizable Mexican Lotería Board Game, Print Studio & Offline PWA Caller)  
**Architecture Pattern:** Feature-Oriented React Architecture + Offline-First PWA (`IndexedDB`) + P2P WebRTC Sync + Client-Side Canvas PDF Pipeline  
**Status:** Production Release (`v1.0.0`)  

---

## 1. System Overview

Custom Lotería is a 100% client-side, installable Progressive Web App (PWA) hosted on GitHub Pages where each device maintains its own isolated, high-capacity custom deck instance. It is engineered around three core subsystems:

1. **Digital Caller (*El Cantador*):** An offline-ready automated and manual card calling environment powered by a synchronous **Web Speech API** narrator (with 4 acoustic pitch/rate personas), static MP3 sound effects (*"¡Buenas!"*, *"¡Lotería!"*, shuffling, applause), procedural Web Audio fallbacks, live history tracking, and *Carta Mayor* tie-breaker mode.
2. **Deck & Board Print Studio (*Generador y Tablas a PDF*):** A 4-step studio to customize all 54 cards with personal photographs (automatically compressed via `imageOptimizer.ts`), style decorative frames, and generate mathematically unique printable boards exported via a direct HTML5 Canvas 2D $\rightarrow$ `jsPDF` pipeline.
3. **Cross-Device Deck Provisioning (P2P QR & Single-File `.json`):** Allows organizers to build their 54-card deck on a Desktop PC and beam it directly to a mobile phone or installed PWA in seconds via **WebRTC Peer-to-Peer (`PeerJS`)** using a live QR Code or 6-character pairing code, automatically locking the phone into *Cantador* mode with the organizer's PIN.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                          APP ENTRYPOINT (App.tsx)                            │
│    IndexedDB Hydration • PIN Guard • ?sync=CODE Auto-Receiver • i18n         │
└───────────────┬──────────────────────────────────────────────┬───────────────┘
                │                                              │
                ▼                                              ▼
┌────────────────────────────────────────┐    ┌────────────────────────────────┐
│             CANTADOR VIEW              │    │         GENERATOR VIEW         │
│ - Auto/Manual Timer & WakeLock         │    │ 1. 54-Card Grid & Swipe Editor │
│ - AudioCantador (Web Speech + MP3 FX)  │    │ 2. Frame & Typography Studio   │
│ - Called History & Tie-Breaker Modal   │    │ 3. Unique Board Permutations   │
│ - PWA Install & P2P Code Sync          │    │ 4. WYSIWYG PDF & Event Lock    │
└───────────────┬────────────────────────┘    └────────────────┬───────────────┘
                │                                              │
                └───────────────┬──────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CORE INFRASTRUCTURE LAYER                            │
│  • deckStorage.ts (IndexedDB >250MB + Legacy localStorage Auto-Migration)    │
│  • p2pDeckSync.ts (WebRTC 16KB Chunked Transfer + FNV-1a Checksum)           │
│  • pdfGenerator.ts (Direct HTML5 Canvas 2D Layered Renderer + jsPDF)         │
│  • pwaInstaller.ts + public/sw.js (Offline App Shell & Audio Cache)          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Technical Subsystems

### 2.1 High-Capacity Local Storage (`src/utils/deckStorage.ts`)
* **Problem Solved:** Browser `localStorage` imposes a strict ~5 MB quota, which is easily exceeded when storing 54 custom photographs as Base64 Data URLs.
* **Design:** All 54 card objects and their embedded images are persisted in **`IndexedDB`** (`loteria_custom_db` $\rightarrow$ object store `decks`, key `active_deck_cards`) with 300ms debounced writes during editing and immediate atomic writes upon P2P/JSON import.
* **Transparent Migration:** On first boot, if `IndexedDB` is empty and legacy `localStorage` data (`loteria_cards_v3`) exists, `loadCardsFromStorage()` automatically migrates the deck to `IndexedDB` and frees `localStorage`.

### 2.2 Progressive Web App & Service Worker (`public/manifest.json`, `public/sw.js`, `src/utils/pwaInstaller.ts`)
* **Offline Strategy:**
  * **Audio Assets (`/audio/*`):** Served **Cache-First** so *"¡Buenas!"*, *"¡Lotería!"*, shuffling, and applause trigger with zero network latency even in airplane mode.
  * **Navigation & App Shell:** Served **Network-First with Cache Fallback** (and **Stale-While-Revalidate** for hashed JS/CSS/font bundles).
  * **Cross-Origin Bypass:** External origins (such as `0.peerjs.com` WebRTC signaling) bypass the Service Worker cache so live P2P connections are never stale-cached.

### 2.3 WebRTC Peer-to-Peer QR Transfer (`src/utils/p2pDeckSync.ts`, `src/components/QRTransferModal.tsx`)
* **Dual Entry (Camera QR + 6-Char Code for iOS PWA):**
  * Scanning the QR opens `?sync=XXXXXX` and starts downloading automatically.
  * Because iOS isolates Safari storage from Home Screen PWAs, users who already installed the PWA on iPhone can tap **Settings $\rightarrow$ Sync** inside the PWA and type the unambiguous 6-character code (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, e.g., `K7M-49P`).
* **Chunked Streaming & Integrity:**
  * WebRTC SCTP DataChannels drop oversized single messages (>64 KB) across mobile browsers. `p2pDeckSync.ts` splits the serialized `DeckPackage` JSON (typically 2.5–5 MB) into **16 KB chunks**, monitors `dataChannel.bufferedAmount` backpressure, reports real-time progress (`0%–100%`), and verifies end-to-end integrity via a 32-bit **FNV-1a checksum** before committing to `IndexedDB`.

### 2.4 Direct Canvas 2D PDF Rendering (`src/utils/pdfGenerator.ts`)
* **State Synchronization:** Generated boards (`GeneratedBoard[]`) are lifted to `GeneratorView.tsx` and shared between Step 3 (*Vista Previa de Tablas*) and Step 4 (*Descarga PDF*), guaranteeing that the printed PDF boards are 100% identical to the previewed boards.
* **Layered Drawing Order:** Each card cell is rendered onto a high-DPI HTML5 `<canvas>` in strict z-order:
  1. Card background fill
  2. Aspect-ratio cover-cropped card photograph/SVG
  3. Decorative frame (`traditional_gallo`, `botanical_litho`, `talavera`, `vintage_poster`, `minimal_modern`) with isolated subpaths (`ctx.beginPath()`)
  4. High-contrast number pill badge
  5. Auto-fitted card title banner

### 2.5 Native TTS & Audio Engine (`src/utils/audioCantador.ts`)
* **Mobile Gesture Unlock (`audioCantador.unlock()`):** Invoked synchronously inside user `onClick` handlers (*"Comenzar Ronda"*, *"Siguiente"*, *"Probar Voz"*) to unlock the Web Audio API `AudioContext` and prime `window.speechSynthesis` on iOS Safari and Android Chrome.
* **Acoustic Persona Modulation:** Applies distinct `pitch` and `rateMultiplier` profiles across 4 caller personas (*Dalia • Tradicional*, *Don Fermín • Gritón*, *La Sobrina • Juvenil*, *El Locutor • Radiofónico*) combined with smart regional voice selection (`es-MX` $\rightarrow$ `es-US` $\rightarrow$ `es-419` $\rightarrow$ `es-ES`).
* **Watchdog Timer:** Protects automated card calling against mobile browser `onend` event drops by computing a dynamic safety timeout per utterance.

---

## 3. Quality Assurance & CI/CD

* **Automated Test Suite (`vitest`):** 51 unit and integration tests across 10 test files covering board permutation uniqueness, image compression, JSON I/O validation, `IndexedDB` storage, WebRTC chunking/checksums, PDF generation, i18n, and full PIN unlock $\leftrightarrow$ Generator $\leftrightarrow$ Cantador user flows.
* **GitHub Actions Pipelines:**
  * [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): Runs `npm ci`, `npm test`, and `npm run build` on every push and pull request.
  * [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml): Automatically builds and deploys the `dist/` bundle to GitHub Pages on pushes to `main`.
