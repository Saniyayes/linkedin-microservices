# Nodework — LinkedIn-style Social Platform

A microservices-based social platform: JWT authentication, a feed, profiles, and connections, built with Spring Boot and a React frontend, fronted by an API gateway.

## Architecture

**Runtime services**

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 8080 | Single entry point; routes `/api/**` to the right service |
| `user-service` | 8081 | Registration, login, JWT issuance, profile |
| `social-service` | 8082 | Connections, followers, second-degree suggestions |
| `post-service` | 8083 | Create/read posts |
| `feed-service` | 8084 | Feed retrieval |
| `frontend` | 3000 | React (Vite) SPA — login, feed, profile, connections |

**Current state, honestly:** `user-service` and `post-service` now persist to real Postgres via JPA (locally: the `docker-compose` postgres container; deployed: RDS). `social-service` and `feed-service` still hold data in-memory — connections/feed data resets on restart. That's the next real step, not yet done here.

## Local development

```bash
docker compose up -d --build
cd frontend && npm install && npm run dev
```
Frontend: `http://localhost:3000`. Gateway: `http://localhost:8080`.

## API

See `docs/postman_collection.json` — import into Postman/Insomnia. Covers register, login, posts, connections, health checks.

## Load testing

```bash
k6 run -e BASE_URL=http://localhost:8080 load-test/loadtest.js
```
Ramps 0→100 virtual users through login → feed → post → profile. See `load-test/loadtest.js` for thresholds.

## Deployment (AWS)

One-time infra setup:
```bash
chmod +x deploy/aws-setup.sh
./deploy/aws-setup.sh
```
Creates: ECR repo + EB application/environment per service, an RDS Postgres instance, and IAM roles. CloudWatch log streaming and enhanced health reporting are enabled on every EB environment by default — no extra setup needed for basic monitoring (EB console → your environment → **Monitoring** tab, and CloudWatch console → Log groups → `/aws/elasticbeanstalk/linkedin-*`).

After that, add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as GitHub repo secrets (Settings → Secrets and variables → Actions). Every push to `main` then runs `.github/workflows/deploy.yml`: build + test all 5 services → (on main only) build Docker images → push to ECR → deploy to Elastic Beanstalk.

## Known limitations / honest next steps

- **`social-service` and `feed-service` still don't persist** — data resets on restart. Same JPA pattern as `user-service`/`post-service`, just not done yet.
- **Gateway does not enforce JWT** on downstream routes yet — `user-service` issues valid tokens, but nothing currently rejects unauthenticated requests at the gateway.
- **No automated tests beyond `mvn verify`'s default surefire run** — the services don't currently have meaningful unit/integration test coverage; CI runs whatever exists.
- Monitoring is CloudWatch only (logs + EB health). Prometheus/Grafana would give better cross-service dashboards and custom business metrics — worth adding once the above are in place, not before.
- RDS security group is opened to `0.0.0.0:0` on port 5432 for a first working deployment — tighten this to just your EB instances' security group once things are confirmed working.

## Repo structure

```
api-gateway/, user-service/, social-service/, post-service/, feed-service/  - Spring Boot services
frontend/                    - React (Vite) SPA
load-test/loadtest.js        - k6 load test
docs/postman_collection.json - API collection
deploy/aws-setup.sh          - one-time AWS infra provisioning
.github/workflows/deploy.yml - CI/CD pipeline
docker-compose.yml           - local dev stack
```
