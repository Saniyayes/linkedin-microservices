document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Tab Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');

    const tabTitles = {
        'architecture': 'System Topology & Microservices Architecture',
        'fanout': 'Kafka Fan-Out on Write Engine',
        'graph': 'Neo4j Social Connection Graph',
        'benchmark': 'Redis Cache vs Relational DB Benchmark',
        'api-tester': 'Interactive API Gateway Client'
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
            pageTitle.textContent = tabTitles[targetTab];
        });
    });

    // Simulated Followers List
    const followers = [
        { id: 'user_102', name: 'Bob Smith', feed: [] },
        { id: 'user_103', name: 'Carol Davis', feed: [] },
        { id: 'user_104', name: 'David Lee', feed: [] }
    ];

    function renderFollowerFeeds() {
        const container = document.getElementById('followers-feeds-list');
        if (!container) return;

        container.innerHTML = followers.map(f => `
            <div class="feed-card">
                <div class="feed-user">${f.name} (${f.id})</div>
                ${f.feed.length === 0 
                    ? '<span class="step-detail">Redis Feed Empty</span>' 
                    : f.feed.map(post => `
                        <div class="feed-item">
                            <strong>${post.author}</strong>: "${post.content}"
                            <div style="font-size:0.65rem; color:#10b981; margin-top:4px;">Pushed via Kafka Fan-Out</div>
                        </div>
                    `).join('')}
            </div>
        `).join('');
    }

    renderFollowerFeeds();

    // Trigger Kafka Fan-out Animation
    const btnFanout = document.getElementById('btn-trigger-fanout');
    if (btnFanout) {
        btnFanout.addEventListener('click', async () => {
            const content = document.getElementById('fanout-content').value || 'New post';
            const author = document.getElementById('fanout-author').value || 'Alice';

            // Step 1
            const steps = [1, 2, 3, 4].map(id => document.getElementById(`step-${id}`));
            steps.forEach(s => s.classList.remove('active'));

            steps[0].classList.add('active');
            await new Promise(r => setTimeout(r, 400));

            // Step 2
            steps[1].classList.add('active');
            await new Promise(r => setTimeout(r, 500));

            // Step 3
            steps[2].classList.add('active');
            await new Promise(r => setTimeout(r, 500));

            // Step 4
            steps[3].classList.add('active');

            // Update follower feeds in Redis
            followers.forEach(f => {
                f.feed.unshift({ author, content, time: 'Just now' });
            });

            renderFollowerFeeds();
        });
    }

    // Interactive API Tester
    const btnSendReq = document.getElementById('btn-send-request');
    const apiPreset = document.getElementById('api-preset');
    const responseJson = document.getElementById('api-response-json');
    const resStatus = document.getElementById('res-status');
    const resTime = document.getElementById('res-time');

    if (btnSendReq) {
        btnSendReq.addEventListener('click', async () => {
            const path = apiPreset.value;
            resStatus.textContent = "Connecting to Gateway...";

            try {
                // Try live API Gateway call
                const response = await fetch(`http://localhost:8080${path}`);
                const data = await response.json();
                resStatus.textContent = `${response.status} OK`;
                responseJson.textContent = JSON.stringify(data, null, 2);
            } catch (err) {
                // Fallback to simulated microservice response if backend container is not actively running
                resStatus.textContent = "200 OK (Simulated)";
                resTime.textContent = "2.1 ms";

                if (path.includes('feed')) {
                    responseJson.textContent = JSON.stringify({
                        userId: "user_102",
                        architecturePattern: "Fan-Out on Write (Kafka -> Redis Cache)",
                        retrievalSource: "Redis In-Memory Key-Value Store",
                        feedCount: 1,
                        posts: [
                            {
                                id: "post_8901",
                                authorId: "user_101",
                                authorName: "Alice Chen",
                                content: "Excited to share that we just migrated our core feeds to a Kafka Fan-Out architecture with Redis caching! 🚀 #systemdesign #kafka #redis #springboot",
                                likesCount: 142,
                                commentsCount: 18,
                                fanoutSource: "KAFKA_EVENT_CONSUMER"
                            }
                        ],
                        queryPerformance: {
                            redisLatencyMs: 1.8,
                            equivalentSqlJoinLatencyMs: 340.5,
                            speedupFactor: "170x Faster"
                        }
                    }, null, 2);
                } else if (path.includes('second-degree')) {
                    responseJson.textContent = JSON.stringify({
                        userId: "user_101",
                        query: "MATCH (u:User {id: $id})-[:CONNECTED]-(m)-[:CONNECTED]-(f2) RETURN f2",
                        firstDegree: ["user_102", "user_103"],
                        secondDegree: ["user_104", "user_105"],
                        executionTimeMs: 2.4
                    }, null, 2);
                } else {
                    responseJson.textContent = JSON.stringify({
                        id: "user_101",
                        name: "Alice Chen",
                        title: "Senior Backend Engineer @ TechCorp",
                        skills: ["Spring Boot", "Kafka", "Redis", "Distributed Systems"],
                        company: "TechCorp",
                        college: "Stanford University",
                        connectionsCount: 482
                    }, null, 2);
                }
            }
        });
    }
});
