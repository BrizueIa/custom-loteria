import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';
import fs from 'fs';
import { execFile } from 'child_process';
import crypto from 'crypto';

const VOICE_MAP: Record<string, string> = {
  'dona_plantas': 'es-MX-DaliaNeural',
  'don_fermin': 'es-MX-JorgeNeural',
  'sobrina': 'es-ES-ElviraNeural',
  'locutor': 'es-CO-GonzaloNeural',
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'tts-proxy-middleware',
      configureServer(server) {
        server.middlewares.use('/api/tts', (req, res) => {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          const text = urlObj.searchParams.get('q') || '';
          const voiceKey = urlObj.searchParams.get('voice') || 'dona_plantas';
          if (!text) {
            res.statusCode = 400;
            res.end('Missing text query');
            return;
          }

          const neuralVoice = VOICE_MAP[voiceKey] || 'es-MX-DaliaNeural';
          const hash = crypto.createHash('md5').update(`${neuralVoice}_${text}`).digest('hex');
          const cachePath = `/tmp/loteria_tts_${hash}.mp3`;

          if (fs.existsSync(cachePath)) {
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Access-Control-Allow-Origin', '*');
            fs.createReadStream(cachePath).pipe(res);
            return;
          }

          const edgeTtsBin = '/tmp/tts_venv/bin/edge-tts';
          if (fs.existsSync(edgeTtsBin)) {
            execFile(edgeTtsBin, ['--voice', neuralVoice, '--text', text, '--write-media', cachePath], (err) => {
              if (!err && fs.existsSync(cachePath)) {
                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Cache-Control', 'public, max-age=86400');
                res.setHeader('Access-Control-Allow-Origin', '*');
                fs.createReadStream(cachePath).pipe(res);
                return;
              }
              fallbackGoogle();
            });
          } else {
            fallbackGoogle();
          }

          function fallbackGoogle() {
            const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q=${encodeURIComponent(text)}`;
            https.get(googleUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
              }
            }, (proxyRes) => {
              res.setHeader('Content-Type', 'audio/mpeg');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.setHeader('Access-Control-Allow-Origin', '*');
              proxyRes.pipe(res);
            }).on('error', (err) => {
              res.statusCode = 500;
              res.end(err.message);
            });
          }
        });
      }
    }
  ],
  server: {
    host: true,
    port: 5173
  }
});
