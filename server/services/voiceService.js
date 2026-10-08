// Voice Services (STT and TTS abstraction layers)

export class SpeechRecognitionUnavailableError extends Error {
  constructor(message = 'Speech-to-text service is unavailable. Please use browser Web Speech API or configure OPENAI_API_KEY.') {
    super(message);
    this.name = 'SpeechRecognitionUnavailableError';
    this.status = 503;
    this.code = 'STT_UNAVAILABLE';
  }
}

export const speechToTextService = {
  async transcribeAudio(audioBufferOrBase64, mimeType = 'audio/webm') {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && audioBufferOrBase64) {
      try {
        const buffer = Buffer.isBuffer(audioBufferOrBase64)
          ? audioBufferOrBase64
          : Buffer.from(String(audioBufferOrBase64).replace(/^data:audio\/\w+;base64,/, ''), 'base64');

        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        formData.append('file', blob, 'audio.webm');
        formData.append('model', 'whisper-1');

        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`
          },
          body: formData
        });

        if (!res.ok) {
          throw new Error(`Whisper API HTTP ${res.status}`);
        }

        const data = await res.json();
        return {
          text: data.text || '',
          confidence: 1.0,
          provider: 'whisper'
        };
      } catch (err) {
        console.warn('[STT] External transcribe failed:', err.message);
        throw new SpeechRecognitionUnavailableError(`STT service failed: ${err.message}`);
      }
    }

    // Never return a canned fake transcription
    throw new SpeechRecognitionUnavailableError(
      'Server-side Whisper STT is not configured. Web Speech API should be used on client.'
    );
  }
};

export const textToSpeechService = {
  async synthesizeSpeech(text, petPersonality = 'Easygoing') {
    // Client-side Web Speech API executes native SpeechSynthesis
    return {
      text,
      voicePitch: petPersonality === 'Sunny' ? 1.3 : (petPersonality === 'Tsundere' ? 1.1 : 1.0),
      voiceRate: petPersonality === 'Otaku' ? 0.95 : 1.05,
      supported: true
    };
  }
};
