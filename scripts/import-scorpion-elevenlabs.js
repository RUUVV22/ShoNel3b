// Imports completed ElevenLabs MP3 files using short-lived signed URLs.
// The JSON job file is temporary and deleted after each import attempt.
// No API keys or signed URLs are stored in source control.
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const relativePattern = /^assets\/scorpion-(?:narration|sfx)\/[a-z0-9_]+\.mp3$/;

(async () => {
  const name = process.argv[2];
  if (!name || !/^scripts\/\.scorpion-import-[a-z0-9-]+\.json$/.test(name.replaceAll('\\', '/'))) {
    throw new Error('Expected temporary scripts/.scorpion-import-*.json manifest');
  }
  const manifest = path.resolve(root, name);
  let errors = 0, saved = 0;
  try {
    const files = JSON.parse(await fs.readFile(manifest, 'utf8'));
    for (const { file, url } of files) {
      try {
        if (!relativePattern.test(file) || !url.startsWith('https://storage.googleapis.com/')) {
          throw new Error('Refusing unexpected path or URL');
        }
        const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const content = Buffer.from(await response.arrayBuffer());
        if (content.length < 100 || !(content.subarray(0, 3).toString('latin1') === 'ID3' || content[0] === 0xff)) {
          throw new Error('Response is not an MP3: ' + content.length + ' bytes');
        }
        const target = path.resolve(root, file);
        await fs.mkdir(path.dirname(target), { recursive: true });
        const temp = target + '.tmp';
        await fs.writeFile(temp, content);
        await fs.rename(temp, target);
        console.log('SAVED ' + file + ' (' + content.length + ' bytes)');
        saved++;
      } catch (error) { errors++; console.error('FAILED ' + file + ': ' + error.message); }
    }
  } finally { await fs.unlink(manifest).catch(() => {}); }
  console.log('Imported ' + saved + ' MP3s; failed ' + errors);
  if (errors) process.exitCode = 1;
})().catch(err => { console.error(err); process.exitCode = 1; });
