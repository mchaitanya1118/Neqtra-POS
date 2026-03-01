const axios = require('axios');
const apiKey = 'AIzaSyAnXa0VGT3PsV2KjzagX4I0wmpT_ApFzO0';

async function check() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await axios.get(url);
    console.log('SUCCESS');
    console.log('Available Models:', response.data.models.map(m => m.name));
  } catch (e) {
    console.log('ERROR');
    if (e.response) {
      console.log('Status:', e.response.status);
      console.log('Data:', JSON.stringify(e.response.data, null, 2));
    } else {
      console.log('Message:', e.message);
    }
  }
}

check();
