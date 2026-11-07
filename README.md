# Nodework — Advanced LinkedIn-Style Professional Networking Platform

An enterprise-ready, microservices-based professional networking platform inspired by LinkedIn. Features comprehensive profile management, connection requests, 2nd-degree network suggestions, dynamic post feed with likes/comments/bookmarks, real-time messaging, notification center, and a full-featured job recruitment board.

---

## 🏛️ Microservices Architecture

| Service | Port | Runtime | Persistence | Responsibilities |
|---|---|---|---|---|
| **`api-gateway`** | 8080 | Spring Cloud Gateway | — | Single public reverse proxy, CORS routing for `/api/**`, health checks |
| **`user-service`** | 8081 | Spring Boot 3 / Java 17 | PostgreSQL (`user_db`) | JWT authentication, user registration, profile strength calculation, experience, education, certifications, user search |
| **`social-service`**| 8082 | Spring Boot 3 / Java 17 | PostgreSQL (`social_db`) | Invitations & connection requests (send/accept/reject/withdraw/remove), follow/unfollow, 2nd-degree network discovery |
| **`post-service`**  | 8083 | Spring Boot 3 / Java 17 | PostgreSQL (`post_db`) | Posts CRUD, image attachments, likes/unlikes, comments, bookmarking, job board (post jobs, apply, search, save) |
| **`feed-service`**  | 8084 | Spring Boot 3 / Java 17 | PostgreSQL (`feed_db`) | Personalized feed ranking, notification center CRUD, 1-to-1 conversation & direct messaging |
| **`frontend`**      | 3000 | React 18 + Vite | LocalStorage (JWT) | LinkedIn-style 3-column responsive UI, post composer, network manager, profile strength meter, split-view jobs, chat |

---

## ✨ Implemented LinkedIn-Style Features

### 1. Authentication & Profiles
- **JWT Authentication**: Secure registration and token-based login.
- **Profile Strength Indicator**: Dynamic percentage-based meter tracking profile completeness.
- **Rich Experience & Education**: Add, edit, and delete positions and academic degrees.
- **Certifications & Skills**: Showcase professional credentials and searchable expertise.
- **Profile Hero**: Custom avatar and banner photo upload support with live editing.

### 2. Professional Networking (My Network)
- **Invitations Manager**: Send, accept, ignore, and withdraw pending connection requests.
- **Connections List**: View established professional relationships and mutual contacts.
- **Follow / Unfollow**: Subscribe to thought leaders and colleagues without direct connection.
- **2nd-Degree Recommendations**: Algorithmic suggestion of connections of connections.

### 3. Content Management & News Feed
- **Rich Post Composer**: Create text posts with media/image attachments.
- **Reactions & Engagement**: Real-time Like/Unlike counter and comment threads.
- **Saved Posts**: Bookmark important industry posts for later reading.
- **Personalized Ranking**: Feeds prioritized by connections, followed professionals, and recent activity.

### 4. Professional Job Board
- **Job Recruitment**: Post job openings with location, company, salary range, and type.
- **Search & Filters**: Filter opportunities by title, company, or workplace type (Remote/Hybrid/Onsite).
- **Easy Apply**: Submit job applications with resume links and contact details.
- **Application Tracking**: View applied jobs and track status in real-time.
- **Saved Jobs**: Bookmark opportunities to apply later.

### 5. Direct Messaging & Notifications
- **1-to-1 Conversations**: Real-time message exchange between connected professionals.
- **Notification Center**: Instant badges for received invitations, post likes, comments, and messages.
- **Mark as Read**: Filter unread alerts and clear notification queues.

---

## 🚀 One-Click Cloud Deployment on Render

This repository includes a native **Render Blueprint (`render.yaml`)** to deploy the entire stack automatically:

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New** → **Blueprint**.
3. Connect your GitHub repository: `https://github.com/Saniyayes/linkedin-microservices`.
4. Select the `main` branch.
5. Render reads `render.yaml` and provisions:
   - **`nodework-postgres`**: Managed PostgreSQL database.
   - **`nodework-api-gateway`**: Public gateway routing traffic to microservices.
   - **`nodework-user-service`**: User authentication and profile service.
   - **`nodework-social-service`**: Social graph and connections service.
   - **`nodework-post-service`**: Post, comment, like, and job service.
   - **`nodework-feed-service`**: Feed, messaging, and notification service.
   - **`nodework-frontend`**: Static Site hosting the React SPA.
6. Click **Apply** to deploy the entire architecture.

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/Saniyayes/linkedin-microservices.git
cd linkedin-microservices

# Start all databases and services via Docker
docker compose up -d --build

# Run the React frontend
cd frontend
npm install
npm run dev
```
- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:8080`
- Health check: `http://localhost:8080/health`
