const axios = require('axios');

async function run() {
  const email = 'nonexistent_test_student@gmail.com';
  
  console.log('Sending OTP...');
  try {
    const sendRes = await axios.post('http://localhost:5000/api/v1/auth/otp/send', {
      email: email
    }, {
      headers: {
        'x-tenant-subdomain': 'deepak-school',
        'Content-Type': 'application/json'
      }
    });
    console.log('OTP Send Response:', sendRes.data);
  } catch (err) {
    console.error('OTP Send Error:', err.response?.data || err.message);
    return;
  }

  console.log('Verifying OTP...');
  try {
    const verifyRes = await axios.post('http://localhost:5000/api/v1/auth/otp/verify', {
      email: email,
      otp: '123456', // dummy/dev otp
      role: 'student'
    }, {
      headers: {
        'x-tenant-subdomain': 'deepak-school',
        'Content-Type': 'application/json'
      }
    });
    console.log('OTP Verify Response:', verifyRes.data);
  } catch (err) {
    console.error('OTP Verify Error:', err.response?.data || err.message);
  }
}

run().catch(console.error);
