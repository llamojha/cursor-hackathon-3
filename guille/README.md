# guille — HumanoVerificado + Roast Match

Captcha con visión (LibreYOLO en el navegador) y modo **Roast Match**: perfiles con outfit, red flag, toxicidad y red flags en texto; el usuario hace roast y OpenAI valida si es lo bastante mordaz y acierta las red flags → match y teléfono.

## Arranque local

```bash
cd guille
cp .env.example .env
# Edita .env y pon OPENAI_API_KEY=sk-...
npm install
npm run dev
```

- Frontend: https://localhost:5173 (HTTPS por la cámara)
- API roast: http://localhost:3000/api/roast

## Estructura

- `src/` — landing/captcha, roast-match UI
- `server/` — Express + validación OpenAI (`POST /api/roast/validate`)
- `server/data/profiles.json` — perfiles de demo

No incluye el minijuego multijugador «Mano & Espalda» (batalla de espaldas).
