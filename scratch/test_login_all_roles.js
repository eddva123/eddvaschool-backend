const axios = require('axios');

async function testRole(role, email) {
  console.log(`\n========================================`);
  console.log(`Testing E2E OTP login for Role: ${role} | Email: ${email}`);
  console.log(`========================================`);

  console.log('1. Sending OTP...');
  try {
    const sendRes = await axios.post('http://localhost:5000/api/v1/auth/otp/send', {
      email: email,
      role: role
    }, {
      headers: {
        'x-tenant-subdomain': 'deepak-school',
        'Content-Type': 'application/json'
      }
    });
    console.log('OTP Send Response:', sendRes.data);
  } catch (err) {
    console.error('OTP Send Error:', err.response?.data || err.message);
    return false;
  }

  console.log('2. Verifying OTP (using dev OTP 123456)...');
  try {
    const verifyRes = await axios.post('http://localhost:5000/api/v1/auth/otp/verify', {
      email: email,
      otp: '123456',
      role: role
    }, {
      headers: {
        'x-tenant-subdomain': 'deepak-school',
        'Content-Type': 'application/json'
      }
    });
    console.log('OTP Verify Response User:', verifyRes.data?.data?.user);
    console.log('OTP Verify Response Success (has token):', !!(verifyRes.data?.data?.token || verifyRes.data?.data?.accessToken));
    return true;
  } catch (err) {
    console.error('OTP Verify Error:', err.response?.data || err.message);
    return false;
  }
}

async function run() {
  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@eddva.test`;
  const teacherEmail = `teacher_${timestamp}@eddva.test`;
  const adminEmail = `admin_${timestamp}@eddva.test`;

  const studentOk = await testRole('student', studentEmail);
  const teacherOk = await testRole('teacher', teacherEmail);
  const adminOk = await testRole('institute_admin', adminEmail);

  console.log(`\n========================================`);
  console.log(`SUMMARY:`);
  console.log(`Student login on-the-fly: ${studentOk ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Teacher login on-the-fly: ${teacherOk ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Institute Admin login on-the-fly: ${adminOk ? 'SUCCESS' : 'FAILED'}`);
  console.log(`========================================`);
}

run().catch(console.error);
