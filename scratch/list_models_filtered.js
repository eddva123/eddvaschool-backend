const api_key = 'AIzaSyBZXwp1o3VegmNBW2PgadSIxbAbzGMHvWs';

async function list() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${api_key}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      const names = data.models.map(m => m.name);
      console.log('Available models:', names.filter(n => n.includes('gemini-') && !n.includes('embedding') && !n.includes('audio')));
    } else {
      console.log('No models returned:', data);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

list();
