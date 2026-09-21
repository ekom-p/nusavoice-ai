# NusaVoice 2

NusaVoice 2 is a mobile-first web app with two engines:

- **Lokal / Browser**: does not call Gemini. Uses the TTS engine installed in the user's browser/phone and works after the app shell has been cached.
- **Gemini Cloud**: optional high-quality generation, called only when the user explicitly selects it and presses Generate.

## Vercel
1. Upload this folder to GitHub or import it into Vercel.
2. Add `GEMINI_API_KEY` only if Cloud mode is desired.
3. Deploy.

No Gemini request is made merely by opening a tab.
