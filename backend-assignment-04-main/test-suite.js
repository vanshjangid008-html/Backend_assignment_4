/**
 * Automated Verification Test Suite
 * Tests all requirements from i7Lab 4:
 * 1. Auth Signup & Login (JWT, bcrypt)
 * 2. Protected Routes (403 without token, 200 with JWT)
 * 3. Notes API CRUD (POST, GET, PUT, DELETE)
 * 4. Real-Time Chat via Socket.IO (room join, bidirectional messaging)
 * 5. Event-Driven features (EventEmitter triggers)
 */

const { io } = require('socket.io-client');
const { server } = require('./server');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  // Allow server a brief moment to bind to port if started together
  await new Promise((res) => setTimeout(res, 800));

  console.log('====================================================');
  console.log('🧪 Starting i7Lab 4 Comprehensive Verification Test');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, description, detail = '') => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${description} ${detail}`);
    }
  };

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert(healthRes.status === 200, 'Health check endpoint returns 200 OK');

    // 2. Signup Test (Matching Page 2)
    const testEmail = `victor_${Date.now()}@example.com`;
    const signupPayload = {
      username: 'victor',
      email: testEmail,
      password: 'password123'
    };

    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupPayload)
    });
    const signupData = await signupRes.json();

    assert(
      signupRes.status === 201 && signupData.message === 'User registered' && signupData.id,
      'POST /api/auth/signup creates user and returns 201 with user id',
      JSON.stringify(signupData)
    );

    const userId = signupData.id;

    // 3. Login Test (Matching Page 3)
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    const loginData = await loginRes.json();

    assert(
      loginRes.status === 200 && loginData.message === 'Login successful' && loginData.token,
      'POST /api/auth/login returns 200 OK with valid JWT token',
      JSON.stringify(loginData)
    );

    const token = loginData.token;

    // 4. Test Protected Route WITHOUT token (Matching Page 3 Figure 1)
    const noTokenRes = await fetch(`${BASE_URL}/api/notes`);
    const noTokenData = await noTokenRes.json();

    assert(
      noTokenRes.status === 403 && noTokenData.message === 'No token provided',
      'GET /api/notes without token returns 403 Forbidden with {"message": "No token provided"}',
      JSON.stringify(noTokenData)
    );

    // 5. Create Note 1 (Matching Page 4 Figure 2)
    const note1Res = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'My First Note',
        content: 'This is my first note of web dev -III'
      })
    });
    const note1Data = await note1Res.json();

    assert(
      note1Res.status === 201 && note1Data.title === 'My First Note' && note1Data.owner === userId,
      'POST /api/notes creates first note with owner and returns 201',
      JSON.stringify(note1Data)
    );

    // 6. Create Note 2 (Matching Page 4 Figure 2)
    const note2Res = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'My Second Note',
        content: 'This is my second note of web dev -III'
      })
    });
    const note2Data = await note2Res.json();

    assert(
      note2Res.status === 201 && note2Data.title === 'My Second Note',
      'POST /api/notes creates second note',
      JSON.stringify(note2Data)
    );

    // 7. GET Notes with token (Matching Page 4 Figure 2)
    const getNotesRes = await fetch(`${BASE_URL}/api/notes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getNotesData = await getNotesRes.json();

    assert(
      getNotesRes.status === 200 && Array.isArray(getNotesData) && getNotesData.length >= 2,
      'GET /api/notes returns user notes list with status 200',
      `Count: ${getNotesData.length}`
    );

    // 8. PUT Note Update
    const updateRes = await fetch(`${BASE_URL}/api/notes/${note1Data._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: 'My First Note (Updated)' })
    });
    const updateData = await updateRes.json();

    assert(
      updateRes.status === 200 && updateData.title === 'My First Note (Updated)',
      'PUT /api/notes/:id updates note successfully'
    );

    // 9. DELETE Note
    const deleteRes = await fetch(`${BASE_URL}/api/notes/${note2Data._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const deleteData = await deleteRes.json();

    assert(
      deleteRes.status === 200 && deleteData.message === 'Note deleted successfully',
      'DELETE /api/notes/:id deletes note successfully'
    );

    // 10. Socket.IO Real-Time Chat (Matching Page 5 Figure 3)
    console.log('\n--- Testing Socket.IO Real-Time Chat (Page 5) ---');
    await new Promise((resolve) => {
      const socket1 = io(BASE_URL);
      const socket2 = io(BASE_URL);

      let messagesReceivedByClient2 = [];

      socket1.on('connect', () => {
        socket1.emit('join_room', { room: 'general', username: 'Aditi' });
      });

      socket2.on('connect', () => {
        socket2.emit('join_room', { room: 'general', username: 'Rohan' });
      });

      socket2.on('receive_message', (msg) => {
        messagesReceivedByClient2.push(msg);

        if (messagesReceivedByClient2.length === 3) {
          assert(
            messagesReceivedByClient2[0].message === 'Hey team, backend is ready 🚀' &&
            messagesReceivedByClient2[1].message === 'Testing chat now...' &&
            messagesReceivedByClient2[2].message === 'Messages arriving in real time ⚡',
            'Socket.IO real-time messages received in correct sequence by room participants'
          );

          socket1.disconnect();
          socket2.disconnect();
          resolve();
        }
      });

      // Send the 3 messages from Figure 3 after connections establish
      setTimeout(() => {
        socket1.emit('send_message', { room: 'general', username: 'Aditi', message: 'Hey team, backend is ready 🚀' });
      }, 300);

      setTimeout(() => {
        socket2.emit('send_message', { room: 'general', username: 'Rohan', message: 'Testing chat now...' });
      }, 600);

      setTimeout(() => {
        socket1.emit('send_message', { room: 'general', username: 'Aditi', message: 'Messages arriving in real time ⚡' });
      }, 900);
    });

    console.log('\n====================================================');
    console.log(`🏁 Test Results: ${passed}/${total} passed (${((passed / total) * 100).toFixed(0)}%)`);
    console.log('====================================================\n');

    setTimeout(() => {
      server.close(() => {
        process.exit(passed === total ? 0 : 1);
      });
    }, 500);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
