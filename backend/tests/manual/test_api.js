
import axios from 'axios';

async function testAdmin() {
  try {
    const res = await axios.get('http://localhost:5000/api/admin/users', {
      headers: {
        Authorization: 'Bearer test' // This will likely return 401/403 but we want to see if it even reaches the route
      }
    });
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (err) {
    console.log('Error Status:', err.response?.status);
    console.log('Error Data:', err.response?.data);
  }
}

testAdmin();
