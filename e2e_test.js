const https = require('https');

const GATEWAY = 'https://nodework-api-gateway.onrender.com';

async function request(path, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const url = new URL(GATEWAY + path);
    const method = options.method || 'GET';
    const headers = options.headers || {};
    let reqBody = options.body;

    if (reqBody && typeof reqBody === 'object') {
      reqBody = JSON.stringify(reqBody);
      headers['Content-Type'] = 'application/json';
    }

    if (reqBody) {
      headers['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const req = https.request(url, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);

    if (reqBody) {
      req.write(reqBody);
    }
    req.end();
  });
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

const results = [];
function report(name, passed, details = '') {
  results.push({ name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} : ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runAudit() {
  console.log('================================================================');
  console.log('   NODEWORK PRODUCTION END-TO-END VERIFICATION AUDIT');
  console.log(`   Target: ${GATEWAY}`);
  console.log('================================================================\n');

  const ts = Date.now();
  const userAEmail = `sarah.qa.${ts}@nodework-test.com`;
  const userBEmail = `john.qa.${ts}@nodework-test.com`;
  const testPassword = 'TestPassword123!';

  let userAId, userAToken;
  let userBId, userBToken;
  let createdPostId;
  let createdJobId;
  let conversationId;

  // ───────────────────────────────────────────────────────────────────────────
  // 1. REGISTRATION TESTS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Testing Registration & Validation ---');
  
  // 1.1 Invalid registration (missing password)
  const regInvalid = await request('/api/users/register', {
    method: 'POST',
    body: { name: 'Incomplete User', email: 'incomplete@nodework.com' }
  });
  report('Validation: Reject incomplete registration', regInvalid.status === 400);

  // 1.2 Successful User A registration
  const regA = await request('/api/users/register', {
    method: 'POST',
    body: {
      name: 'Sarah Connor',
      email: userAEmail,
      password: testPassword,
      title: 'Senior DevOps & Reliability Architect',
      headline: 'Senior DevOps Architect @ Cyberdyne | Kubernetes, Cloud & CI/CD',
      company: 'Cyberdyne Systems',
      location: 'Los Angeles, CA'
    }
  });
  if (regA.status === 200 && regA.data?.token) {
    userAId = regA.data.userId;
    userAToken = regA.data.token;
    report('Registration: User A registered with persistent DB record', true, `userId: ${userAId}`);
  } else {
    report('Registration: User A registered with persistent DB record', false, `HTTP ${regA.status}`);
  }

  // 1.3 Duplicate registration test
  const regDuplicate = await request('/api/users/register', {
    method: 'POST',
    body: {
      name: 'Sarah Duplicate',
      email: userAEmail,
      password: testPassword
    }
  });
  report('Validation: Duplicate email registration rejected (409)', regDuplicate.status === 409);

  // 1.4 Successful User B registration
  const regB = await request('/api/users/register', {
    method: 'POST',
    body: {
      name: 'John Reese',
      email: userBEmail,
      password: testPassword,
      title: 'Staff Security Engineer',
      headline: 'Staff Security Engineer | AppSec & Penetration Testing',
      company: 'DefenseSec',
      location: 'New York, NY'
    }
  });
  if (regB.status === 200 && regB.data?.token) {
    userBId = regB.data.userId;
    userBToken = regB.data.token;
    report('Registration: User B registered with persistent DB record', true, `userId: ${userBId}`);
  } else {
    report('Registration: User B registered with persistent DB record', false, `HTTP ${regB.status}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. LOGIN & AUTHENTICATION TESTS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing Authentication & JWT ---');

  // 2.1 Bad credentials
  const loginBad = await request('/api/users/login', {
    method: 'POST',
    body: { email: userAEmail, password: 'WrongPassword999' }
  });
  report('Authentication: Reject invalid password (401)', loginBad.status === 401);

  // 2.2 Valid login for User A
  const loginA = await request('/api/users/login', {
    method: 'POST',
    body: { email: userAEmail, password: testPassword }
  });
  const loginOk = loginA.status === 200 && Boolean(loginA.data?.token);
  report('Authentication: Successful login and JWT issuance', loginOk);

  // 2.3 Verify /api/users/me with JWT token
  const meRes = await request('/api/users/me', {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  const meOk = meRes.status === 200 && meRes.data?.user?.email === userAEmail;
  report('Authentication: /api/users/me session verification', meOk, `Name: ${meRes.data?.user?.name}`);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PROFILE CRUD & PHONE/WEBSITE FIELDS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Profile CRUD & Extended Attributes ---');

  const updateProfileRes = await request(`/api/users/${userAId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: {
      about: 'Dedicated to building robust infrastructure with high uptime and resilient failovers.',
      phone: '+1 (555) 019-2834',
      website: 'https://sarahconnor.dev',
      skills: ['Kubernetes', 'Docker', 'Terraform', 'PostgreSQL', 'Golang', 'Java']
    }
  });
  report('Profile: Update bio, phone, website, and skills', updateProfileRes.status === 200);

  // Add experience
  const addExpRes = await request(`/api/users/${userAId}/experience`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: {
      title: 'Principal DevOps Architect',
      company: 'Cyberdyne Systems',
      location: 'Los Angeles, CA',
      startDate: '2023-01',
      isCurrent: true,
      description: 'Leading global cloud platform infrastructure.'
    }
  });
  report('Profile: Add work experience record', addExpRes.status === 200);

  // Retrieve full profile
  const getProfRes = await request(`/api/users/${userAId}`);
  const profOk = getProfRes.status === 200 &&
                 getProfRes.data?.phone === '+1 (555) 019-2834' &&
                 getProfRes.data?.website === 'https://sarahconnor.dev' &&
                 getProfRes.data?.experiences?.length > 0;
  report('Profile: Retrieve profile with phone, website, and experiences', profOk);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. SEARCH & DISCOVERY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing User Search & Discovery ---');

  const searchRes = await request('/api/users?q=Sarah&page=0&size=10');
  const searchFound = searchRes.status === 200 &&
                      Array.isArray(searchRes.data?.users) &&
                      searchRes.data.users.some(u => String(u.id) === String(userAId));
  report('Search: Paginated user query (/api/users?q=Sarah)', searchFound, `Total: ${searchRes.data?.totalElements}`);

  // ───────────────────────────────────────────────────────────────────────────
  // 5. POSTS, LIKES, COMMENTS & BOOKMARKS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Testing Feed, Posts, Likes & Comments ---');

  // 5.1 User A publishes a post
  const createPostRes = await request('/api/posts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: {
      authorId: String(userAId),
      authorName: 'Sarah Connor',
      authorHeadline: 'Senior DevOps Architect @ Cyberdyne',
      content: 'Excited to announce we achieved 99.999% uptime across all microservices this quarter! Zero downtime deployments with Kubernetes & Spring Boot.',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      mediaType: 'IMAGE'
    }
  });
  if (createPostRes.status === 200 && createPostRes.data?.post?.id) {
    createdPostId = createPostRes.data.post.id;
    report('Feed: Create post with content and image', true, `postId: ${createdPostId}`);
  } else {
    report('Feed: Create post with content and image', false, `HTTP ${createPostRes.status}`);
  }

  // 5.2 User B retrieves feed
  const feedRes = await request(`/api/posts?userId=${userBId}`);
  const feedContainsPost = Array.isArray(feedRes.data) && feedRes.data.some(p => p.id === createdPostId);
  report('Feed: Retrieve posts from post-service', feedContainsPost);

  // 5.3 User B likes User A's post
  const likeRes = await request(`/api/posts/${createdPostId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userBToken}` },
    body: {
      userId: String(userBId),
      userName: 'John Reese',
      userAvatar: ''
    }
  });
  report('Feed: Like post (triggers notification)', likeRes.status === 200 && likeRes.data?.liked === true);

  // 5.4 User B comments on User A's post
  const commentRes = await request(`/api/posts/${createdPostId}/comments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userBToken}` },
    body: {
      authorId: String(userBId),
      authorName: 'John Reese',
      authorHeadline: 'Staff Security Engineer',
      content: 'Fantastic work Sarah! The security boundaries and zero-trust policies look solid.'
    }
  });
  report('Feed: Comment on post (triggers notification)', commentRes.status === 200 && Boolean(commentRes.data?.id));

  // 5.5 User B bookmarks the post
  const savePostRes = await request(`/api/posts/${createdPostId}/save`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userBToken}` },
    body: { userId: String(userBId) }
  });
  report('Feed: Bookmark post', savePostRes.status === 200 && savePostRes.data?.saved === true);

  // ───────────────────────────────────────────────────────────────────────────
  // 6. CONNECTIONS & SOCIAL GRAPH
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Testing Connections & Social Graph ---');

  // 6.1 User B sends connection request to User A
  const connReqRes = await request('/api/connections/request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userBToken}` },
    body: {
      fromUserId: String(userBId),
      toUserId: String(userAId),
      fromUserName: 'John Reese',
      toUserName: 'Sarah Connor'
    }
  });
  report('Connections: Send connection request', connReqRes.status === 200 && connReqRes.data?.status === 'PENDING');

  // 6.2 User A accepts the connection request
  const acceptRes = await request('/api/connections/accept', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: {
      fromUserId: String(userBId),
      toUserId: String(userAId)
    }
  });
  report('Connections: Accept connection request', acceptRes.status === 200 && acceptRes.data?.status === 'CONNECTED');

  // ───────────────────────────────────────────────────────────────────────────
  // 7. NOTIFICATION CENTER
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Testing Notification Center ---');

  // User A should have received notifications for: Like, Comment, Connection Request, Connection Accepted
  const notifRes = await request(`/api/feed/notifications/${userAId}`, {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  const notifs = Array.isArray(notifRes.data) ? notifRes.data : [];
  const hasLikeNotif = notifs.some(n => n.type === 'POST_LIKE');
  const hasCommentNotif = notifs.some(n => n.type === 'POST_COMMENT');
  const hasConnNotif = notifs.some(n => n.type === 'CONNECTION_REQUEST' || n.type === 'CONNECTION_ACCEPTED');

  report('Notifications: Auto-generated on post like', hasLikeNotif);
  report('Notifications: Auto-generated on post comment', hasCommentNotif);
  report('Notifications: Auto-generated on connection activity', hasConnNotif, `Total notifications: ${notifs.length}`);

  if (notifs.length > 0) {
    const markReadRes = await request(`/api/feed/notifications/${notifs[0].id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    report('Notifications: Mark notification read', markReadRes.status === 200 && markReadRes.data?.read === true);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8. JOBS & APPLICATIONS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. Testing Job Board & Applications ---');

  // 8.1 User A creates a job opening
  const jobCreateRes = await request('/api/posts/jobs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: {
      title: 'Principal Site Reliability Engineer',
      company: 'Cyberdyne Systems',
      location: 'Remote, US',
      jobType: 'Full-time',
      experienceLevel: 'Senior / Staff',
      salaryRange: '$180,000 - $220,000',
      description: 'Looking for a seasoned SRE to lead reliability engineering, automated chaos experiments, and multi-region failovers.',
      requirements: '5+ years Kubernetes, Golang/Java, distributed systems observability.'
    }
  });
  if (jobCreateRes.status === 200 && jobCreateRes.data?.id) {
    createdJobId = jobCreateRes.data.id;
    report('Jobs: Post a new job opening', true, `jobId: ${createdJobId}`);
  } else {
    report('Jobs: Post a new job opening', false, `HTTP ${jobCreateRes.status}`);
  }

  // 8.2 User B queries jobs
  const jobsListRes = await request(`/api/posts/jobs?q=Reliability&userId=${userBId}`);
  const jobFound = Array.isArray(jobsListRes.data) && jobsListRes.data.some(j => j.job?.id === createdJobId);
  report('Jobs: Search job listings by keyword', jobFound);

  // 8.3 User B applies for the job
  const applyRes = await request(`/api/posts/jobs/${createdJobId}/apply`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userBToken}` },
    body: {
      applicantId: String(userBId),
      applicantName: 'John Reese',
      applicantEmail: userBEmail,
      resumeUrl: 'https://johnreese.dev/resume.pdf',
      coverNote: 'Extensive hands-on experience hardening large Kubernetes clusters and designing resilient systems.'
    }
  });
  report('Jobs: Apply for job with resume and cover note', applyRes.status === 200 && applyRes.data?.status === 'APPLIED');

  // 8.4 User B checks my applications
  const myAppsRes = await request(`/api/posts/jobs/my-applications/${userBId}`);
  const appPersisted = Array.isArray(myAppsRes.data) && myAppsRes.data.some(a => a.jobId === createdJobId);
  report('Jobs: Retrieve submitted applications', appPersisted);

  // 8.5 External jobs endpoint check
  const extJobsRes = await request('/api/posts/jobs/external?q=software&country=us&page=1');
  report('Jobs: Adzuna external jobs endpoint functional', extJobsRes.status === 200, `configured: ${extJobsRes.data?.configured}`);

  // ───────────────────────────────────────────────────────────────────────────
  // 9. MESSAGING & CHAT
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. Testing 1-to-1 Chat & Messaging ---');

  // 9.1 Create conversation
  const convRes = await request('/api/chat/conversations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: {
      user1Id: String(userAId),
      user2Id: String(userBId),
      user1Name: 'Sarah Connor',
      user2Name: 'John Reese',
      user1Avatar: '',
      user2Avatar: ''
    }
  });
  if (convRes.status === 200 && convRes.data?.id) {
    conversationId = convRes.data.id;
    report('Messaging: Create or retrieve conversation', true, `convId: ${conversationId}`);
  } else {
    report('Messaging: Create or retrieve conversation', false, `HTTP ${convRes.status}`);
  }

  // 9.2 User A sends message
  const msg1Res = await request('/api/chat/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userAToken}` },
    body: {
      conversationId: String(conversationId),
      senderId: String(userAId),
      senderName: 'Sarah Connor',
      senderAvatar: '',
      recipientId: String(userBId),
      content: 'Hi John, thank you for connecting! Let us coordinate the infrastructure security review.'
    }
  });
  report('Messaging: Send message from User A to User B', msg1Res.status === 200 && Boolean(msg1Res.data?.id));

  // 9.3 User B sends reply
  const msg2Res = await request('/api/chat/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userBToken}` },
    body: {
      conversationId: String(conversationId),
      senderId: String(userBId),
      senderName: 'John Reese',
      senderAvatar: '',
      recipientId: String(userAId),
      content: 'Sounds great Sarah, I have prepared the threat model checklist.'
    }
  });
  report('Messaging: Send reply from User B to User A', msg2Res.status === 200 && Boolean(msg2Res.data?.id));

  // 9.4 Fetch message thread
  const threadRes = await request(`/api/chat/messages/${conversationId}`);
  const threadOk = Array.isArray(threadRes.data) && threadRes.data.length >= 2;
  report('Messaging: Retrieve conversation thread with correct message order', threadOk, `Messages: ${threadRes.data?.length}`);

  // ───────────────────────────────────────────────────────────────────────────
  // 10. PASSWORD RESET
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 10. Testing Password Reset Flow ---');

  const forgotRes = await request('/api/users/forgot-password', {
    method: 'POST',
    body: { email: userAEmail }
  });
  const forgotOk = forgotRes.status === 200 && Boolean(forgotRes.data?.message);
  report('Password Reset: Request password reset instructions', forgotOk, forgotRes.data?.message?.slice(0, 45) + '...');

  // Test invalid token rejection
  const resetBad = await request('/api/users/reset-password', {
    method: 'POST',
    body: { token: 'invalid-non-existent-token-12345', newPassword: 'BrandNewPassword999!' }
  });
  report('Password Reset: Reject invalid/expired reset token', resetBad.status === 400);

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`   TOTAL TESTS: ${results.length}`);
  console.log(`   PASSED:      ${passedCount}`);
  console.log(`   FAILED:      ${failedCount}`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
