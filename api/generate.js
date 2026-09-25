export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method tidak diizinkan.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY belum diset di environment server.' });
    return;
  }

  try {
    const {
      text,
      voice = 'Kore',
      dialect = 'Indonesia',
      vibe = 'berwibawa',
      speed = 1,
      pitch = 0,
      model = process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview'
    } = req.body || {};

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Teks narasi wajib diisi.' });
      return;
    }

    if (text.length > 1500) {
      res.status(400).json({ error: 'Maksimal 1500 karakter per generasi.' });
      return;
    }

    const safeSpeed = Math.min(2, Math.max(0.5, Number(speed) || 1));
    const safePitch = Math.min(5, Math.max(-5, Number(pitch) || 0));

    const prompt = [
      `Bacakan teks berikut dalam bahasa Indonesia.`,
      `Dialek/aksen yang diinginkan: ${dialect}.`,
      `Karakter penyampaian: ${vibe}.`,
      `Kecepatan target sekitar ${safeSpeed}x dan nada suara sekitar ${safePitch >= 0 ? '+' : ''}${safePitch}.`,
      `Jangan mengubah, meringkas, menerjemahkan, atau menambahkan kata pada teks.`,
      `Teks yang harus dibacakan:`,
      text
    ].join('\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice }
            }
          }
        }
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const message = data?.error?.message || 'Gemini API gagal memproses audio.';
      res.status(upstream.status).json({ error: message });
      return;
    }

    const audio = data?.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData
    )?.inlineData?.data;

    if (!audio) {
      res.status(502).json({ error: 'Gemini tidak mengembalikan data audio.' });
      return;
    }

    res.status(200).json({
      audioBase64: audio,
      mimeType: 'audio/pcm;rate=24000',
      sampleRate: 24000,
      channels: 1,
      sampleWidth: 2,
      model
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err?.message || 'Terjadi kesalahan server.'
    });
  }
}
