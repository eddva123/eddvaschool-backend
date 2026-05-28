const api_key = 'AIzaSyBZXwp1o3VegmNBW2PgadSIxbAbzGMHvWs';
const urls = [
  `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${api_key}`,
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${api_key}`,
  `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${api_key}`
];

async function run() {
  for (const url of urls) {
    console.log('Testing url:', url);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'Hello' }]
          }]
        })
      });
      console.log('Status:', res.status);
      const text = await res.text();
      console.log('Response:', text.substring(0, 300));
    } catch (e) {
      console.error('Error for', url, ':', e);
    }
    console.log('-------------------');
  }
}

run();
