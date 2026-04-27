# ArbitrageHub - System Architecture

## Overview

ArbitrageHub is a production-ready sports betting intelligence platform built with a modern microservices-inspired architecture. The system aggregates real-time odds from multiple bookmakers, detects arbitrage opportunities, provides AI-powered predictions, and delivers comprehensive analytics to professional and casual bettors.

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 19 + Tailwind CSS 4 | Dark-mode-first UI, responsive dashboard |
| Backend | Node.js + Express 4 + tRPC 11 | Type-safe API, real-time procedures |
| Database | MySQL/TiDB + Drizzle ORM | Structured data persistence |
| Caching | Redis (optional) | Real-time odds caching, rate limiting |
| Real-Time | WebSockets | Live odds updates, alerts |
| Payments | Stripe API | Subscription processing |
| External APIs | The Odds API | Odds aggregation from 50+ bookmakers |
| LLM | Built-in Forge API | AI predictions and analysis |
| Deployment | Docker + AWS/Vercel/Railway | Scalable infrastructure |

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Dashboard (Dark Mode, Mobile-First)              │   │
│  │  - Live Odds Aggregation Dashboard                      │   │
│  │  - Arbitrage Opportunities Table                        │   │
│  │  - Match Center with Live Scores                        │   │
│  │  - Analytics Dashboard (Recharts)                       │   │
│  │  - User Profile & Settings                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ↓ tRPC + WebSocket                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express Server + tRPC Router                           │   │
│  │  - Authentication & Authorization                       │   │
│  │  - Rate Limiting & API Protection                       │   │
│  │  - Request Validation & Error Handling                  │   │
│  │  - WebSocket Connection Management                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ↓                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Odds Aggregation Service                              │   │
│  │  - Fetch from The Odds API (every 3-5 seconds)         │   │
│  │  - Multi-bookmaker comparison                          │   │
│  │  - Line movement tracking                              │   │
│  │  - Sharp money detection                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Arbitrage Detection Engine                            │   │
│  │  - 2-way arbitrage calculation                         │   │
│  │  - 3-way arbitrage calculation                         │   │
│  │  - Stake distribution optimization                     │   │
│  │  - ROI & profit calculation                            │   │
│  │  - Risk assessment                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AI Prediction Engine                                  │   │
│  │  - Match outcome predictions                           │   │
│  │  - Value bet detection                                 │   │
│  │  - Odds inefficiency analysis                          │   │
│  │  - Historical data analysis                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Alert & Notification System                           │   │
│  │  - Real-time arbitrage alerts                          │   │
│  │  - Odds change notifications                           │   │
│  │  - User preference management                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE LAYER                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  MySQL/TiDB Database                                   │   │
│  │  - Users & Authentication                              │   │
│  │  - Subscriptions & Billing                             │   │
│  │  - Bets & Betting History                              │   │
│  │  - Odds History & Line Movement                        │   │
│  │  - Arbitrage Opportunities                             │   │
│  │  - Alerts & Notifications                              │   │
│  │  - Analytics & Performance Metrics                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Redis Cache (Optional)                                │   │
│  │  - Real-time odds cache                                │   │
│  │  - Session management                                  │   │
│  │  - Rate limit counters                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  The Odds API - Real-time odds aggregation             │   │
│  │  Stripe API - Payment processing                       │   │
│  │  LLM Service - AI predictions & analysis               │   │
│  │  Email Service - Notifications (optional)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Users Table
Manages user accounts, authentication, and subscription status.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(320),
  name TEXT,
  loginMethod VARCHAR(64),
  subscriptionTier ENUM('free', 'pro', 'premium') DEFAULT 'free',
  subscriptionStatus ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
  stripeCustomerId VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subscriptions Table
Tracks subscription history and billing information.

```sql
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  tier ENUM('free', 'pro', 'premium') NOT NULL,
  status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
  stripeSubscriptionId VARCHAR(255),
  currentPeriodStart TIMESTAMP,
  currentPeriodEnd TIMESTAMP,
  cancelledAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Bets Table
Stores user betting records and outcomes.

```sql
CREATE TABLE bets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  matchId VARCHAR(255),
  bookmaker VARCHAR(100),
  market VARCHAR(100),
  odds DECIMAL(10, 3),
  stake DECIMAL(10, 2),
  outcome ENUM('pending', 'won', 'lost', 'voided') DEFAULT 'pending',
  profit DECIMAL(10, 2) NULL,
  roiPercentage DECIMAL(10, 2) NULL,
  placedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settledAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (userId, placedAt)
);
```

### Odds Table
Tracks current odds across bookmakers and markets.

```sql
CREATE TABLE odds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matchId VARCHAR(255) NOT NULL,
  bookmaker VARCHAR(100) NOT NULL,
  market VARCHAR(100) NOT NULL,
  option VARCHAR(100) NOT NULL,
  odds DECIMAL(10, 3) NOT NULL,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (matchId, bookmaker, market, option),
  INDEX (matchId, lastUpdated)
);
```

### Odds History Table
Maintains historical odds data for line movement tracking.

```sql
CREATE TABLE oddsHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matchId VARCHAR(255) NOT NULL,
  bookmaker VARCHAR(100) NOT NULL,
  market VARCHAR(100) NOT NULL,
  option VARCHAR(100) NOT NULL,
  odds DECIMAL(10, 3) NOT NULL,
  recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (matchId, recordedAt),
  INDEX (bookmaker, recordedAt)
);
```

### Arbitrage Opportunities Table
Stores detected arbitrage opportunities.

```sql
CREATE TABLE arbitrageOpportunities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matchId VARCHAR(255) NOT NULL,
  type ENUM('2-way', '3-way') NOT NULL,
  profitPercentage DECIMAL(10, 4) NOT NULL,
  roi DECIMAL(10, 4) NOT NULL,
  riskLevel ENUM('low', 'medium', 'high') NOT NULL,
  stakeDistribution JSON NOT NULL,
  bookmakers JSON NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  detectedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiredAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (matchId, isActive),
  INDEX (detectedAt)
);
```

### Alerts Table
Manages user alerts and notification preferences.

```sql
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type ENUM('arbitrage', 'odds_change', 'match_update') NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (userId, isRead, createdAt)
);
```

### Alert Preferences Table
Stores user notification preferences.

```sql
CREATE TABLE alertPreferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  arbitrageAlerts BOOLEAN DEFAULT TRUE,
  oddsChangeAlerts BOOLEAN DEFAULT TRUE,
  matchUpdateAlerts BOOLEAN DEFAULT TRUE,
  emailNotifications BOOLEAN DEFAULT FALSE,
  pushNotifications BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY (userId)
);
```

## tRPC Router Structure

The backend exposes the following procedure groups:

### Authentication Router
- `auth.me` - Get current user
- `auth.logout` - Logout user

### Odds Router
- `odds.getLiveOdds` - Fetch current odds for a match
- `odds.getOddsHistory` - Get historical odds data
- `odds.getMultiBookmakerComparison` - Compare odds across bookmakers
- `odds.getLineMovement` - Get odds movement history

### Arbitrage Router
- `arbitrage.getOpportunities` - List current arbitrage opportunities
- `arbitrage.getOpportunityDetails` - Get detailed arbitrage calculation
- `arbitrage.calculateArbitrage` - Calculate arbitrage for custom inputs
- `arbitrage.getSuccessRate` - User's arbitrage success metrics

### Match Router
- `match.getLiveMatches` - Get live matches with scores
- `match.getMatchDetails` - Get detailed match information
- `match.getMatchStats` - Get match statistics (possession, shots, xG)
- `match.getEventTimeline` - Get match event timeline

### Prediction Router
- `prediction.getMatchPredictions` - Get AI predictions for a match
- `prediction.getValueBets` - Get value bet recommendations
- `prediction.getOddsInefficiencies` - Detect odds inefficiencies

### Bet Router
- `bet.saveBet` - Save a bet to history
- `bet.getBettingHistory` - Get user's betting history
- `bet.getSavedBets` - Get saved bets
- `bet.updateBetOutcome` - Update bet outcome

### Analytics Router
- `analytics.getUserStats` - Get user's performance statistics
- `analytics.getProfitLoss` - Get profit/loss data
- `analytics.getWinRatio` - Get win/loss ratio
- `analytics.getArbitrageSuccessRate` - Get arbitrage success metrics
- `analytics.getPerformanceTrends` - Get performance trend data

### Alert Router
- `alert.getAlerts` - Get user's alerts
- `alert.markAsRead` - Mark alert as read
- `alert.getPreferences` - Get alert preferences
- `alert.updatePreferences` - Update alert preferences

### Subscription Router
- `subscription.getCurrentTier` - Get user's current subscription
- `subscription.getPlans` - Get available subscription plans
- `subscription.createCheckoutSession` - Create Stripe checkout
- `subscription.getInvoices` - Get billing history

## Real-Time Data Flow

### Odds Update Flow
1. Backend service fetches odds from The Odds API every 3-5 seconds
2. New odds are compared with cached odds
3. If significant changes detected, odds history is recorded
4. WebSocket broadcasts updated odds to connected clients
5. Frontend updates display with visual indicators (up/down arrows)

### Arbitrage Detection Flow
1. On each odds update, arbitrage detection algorithm runs
2. Scans for 2-way and 3-way opportunities
3. Calculates profit percentage, ROI, and risk level
4. Stores new opportunities in database
5. Triggers alerts for subscribed users
6. WebSocket broadcasts new opportunities to dashboard

### Alert Delivery Flow
1. Alert event triggered (new arbitrage, odds change, etc.)
2. System checks user's alert preferences
3. Creates alert record in database
4. Sends WebSocket notification to connected user
5. Optional: sends email/push notification (if enabled)

## Subscription Tiers

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Live Odds Aggregation | Limited (5 bookmakers) | Full (50+ bookmakers) | Full (50+ bookmakers) |
| Arbitrage Detection | Delayed (15 min) | Real-time | Real-time + Advanced |
| Match Center | Basic | Full | Full + Stats |
| AI Predictions | No | Yes | Yes + Custom Models |
| Alerts | Limited (5/day) | Unlimited | Unlimited + Priority |
| Analytics Dashboard | Basic | Full | Full + Advanced |
| Betting History | 30 days | Unlimited | Unlimited |
| API Access | No | No | Yes |
| Support | Community | Email | Priority |
| Price | Free | $9.99/month | $29.99/month |

## Performance & Scalability

### Caching Strategy
- Redis caches current odds (TTL: 5 seconds)
- Database stores historical odds (1-minute intervals)
- Frontend caches UI state with React Query
- API responses cached with 5-second TTL

### Database Optimization
- Indexes on frequently queried columns (userId, matchId, createdAt)
- Partitioning odds history by date for faster queries
- Connection pooling for concurrent requests
- Read replicas for analytics queries

### Real-Time Scalability
- WebSocket connection pooling
- Message broadcasting with Redis pub/sub
- Horizontal scaling with load balancing
- Stateless API servers for auto-scaling

### Rate Limiting
- API rate limits: 100 requests/minute per user
- The Odds API rate limit: 500 requests/month (free tier)
- WebSocket message rate limit: 10 messages/second per connection
- Burst allowance: 20 requests/minute for premium users

## Security Measures

- JWT-based authentication with secure token signing
- HTTPS/TLS encryption for all data in transit
- Password hashing with bcrypt (if applicable)
- SQL injection prevention via Drizzle ORM
- XSS protection via React's built-in escaping
- CSRF protection via SameSite cookies
- Rate limiting to prevent abuse
- API key protection (The Odds API key stored server-side)
- Stripe PCI compliance for payment processing
- Regular security audits and dependency updates

## Deployment Architecture

### Development Environment
- Local development with hot reload
- SQLite or local MySQL for development
- Environment variables via .env file

### Production Environment
- Docker containerization
- Kubernetes orchestration (optional)
- AWS RDS for managed MySQL
- AWS ElastiCache for Redis
- AWS CloudFront for CDN
- AWS Route53 for DNS
- GitHub Actions for CI/CD
- Automated backups and disaster recovery

### Monitoring & Logging
- Application performance monitoring (APM)
- Real-time error tracking (Sentry)
- Log aggregation (CloudWatch/ELK)
- Metrics collection (Prometheus)
- Alerts for critical issues
- Uptime monitoring

## API Rate Limits & Quotas

| Endpoint | Free | Pro | Premium |
|----------|------|-----|---------|
| Live Odds | 10 req/min | 100 req/min | 500 req/min |
| Arbitrage Detection | 5 req/min | 50 req/min | 200 req/min |
| AI Predictions | 0 | 20 req/min | 100 req/min |
| Analytics | 5 req/min | 50 req/min | Unlimited |
| WebSocket Connections | 1 | 5 | 10 |

## Future Enhancements

1. **Mobile App** - Native iOS/Android applications
2. **Automated Betting** - Auto-place bets via bookmaker APIs
3. **Advanced Analytics** - Machine learning models for prediction
4. **Multi-Language Support** - Localization for global markets
5. **Social Features** - Leaderboards, bet sharing, community
6. **Advanced Alerts** - SMS, Telegram, Discord integration
7. **API for Developers** - Public API for third-party integrations
8. **Admin Dashboard** - Platform monitoring and user management
9. **Compliance** - KYC/AML integration for regulated markets
10. **Blockchain Integration** - Decentralized betting pools (future)
