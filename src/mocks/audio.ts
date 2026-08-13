/**
 * Generates a short sine-tone WAV so voice preview / reading-session audio
 * endpoints return real, playable `audio/wav` bytes instead of silence or a
 * data: URI — matching the "audio streamed from the backend" contract
 * without needing a real TTS provider in mock mode.
 */
export function generateToneWav(durationSeconds: number, frequencyHz = 440): Uint8Array {
  const sampleRate = 22050;
  const numSamples = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string): void => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.min(1, i / 200, (numSamples - i) / 200);
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * envelope * 0.2;
    view.setInt16(44 + i * bytesPerSample, Math.round(sample * 32767), true);
  }

  return new Uint8Array(buffer);
}
