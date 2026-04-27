import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/forums');
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Data:', JSON.stringify(data, null, 2));
    } else {
      const text = await res.text();
      console.log('Error Body:', text);
    }
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

test();
