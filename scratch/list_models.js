const api_key = 'AIzaSyBZXwp1o3VegmNBW2PgadSIxbAbzGMHvWs';

async function list() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${api_key}`;
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

list();
