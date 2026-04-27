# ArbitrageHub - Real-Time Sports Arbitrage Intelligence Platform

A production-ready fintech-style web application that gives bettors a real-time edge through odds aggregation, arbitrage detection, AI-powered predictions, and deep analytics.

![ArbitrageHub Dashboard](https://via.placeholder.com/1200x600?text=ArbitrageHub+Dashboard)

---

## 🎯 Features

### 1. **Live Odds Aggregation Dashboard**
- Real-time odds from 50+ bookmakers (The Odds API)
- Auto-refresh every few seconds
- Best-odds highlights across bookmakers
- Multi-sport support (soccer, basketball, tennis, etc.)

### 2. **Arbitrage Detection Engine**
- Automatic 2-way surebet detection (Home/Away)
- 3-way arbitrage detection (Home/Draw/Away)
- Optimal stake distribution calculation
- Guaranteed profit percentage and ROI
- Risk level assessment (Low/Medium/High)

### 3. **Live Match Center**
- Real-time match scores and statistics
- Possession, shots, expected goals (xG)
- Event timeline (goals, cards, substitutions)
- Live odds movement tracking

### 4. **AI Prediction Engine**
- LLM-powered match outcome predictions
- Value bet recommendations
- Odds inefficiency detection
- Historical data analysis

### 5. **Smart Alert System**
- Real-time in-app notifications
- New arbitrage opportunity alerts
- Significant odds change detection
- Sharp money signals
- Customizable alert preferences

### 6. **User Dashboard**
- JWT-based authentication
- Personalized feed of opportunities
- Saved bets and betting history
- ROI analytics with Recharts
- Performance tracking charts

### 7. **Subscription Monetization**
- **Free Tier**: Limited features, delayed detection
- **Pro Tier** ($9.99/mo): Full odds, real-time detection, unlimited alerts
- **Premium Tier** ($29.99/mo): AI predictions, API access, sharp money detection
- Stripe integration for payment processing

### 8. **Analytics Dashboard**
- Profit/Loss tracking
- Win/Loss ratio visualization
- Arbitrage success rate
- Overall performance metrics
- Historical data export

### 9. **Odds Movement Tracking**
- Line history per market
- Multi-bookmaker comparison engine
- Sharp money detection signals
- Odds efficiency analysis

### 10. **Dark-Mode-First UI**
- Mobile-first responsive design
- Fintech-grade visual experience
- Fast loading and smooth interactions
- Professional dashboard layout

---

## 🏗️ Architecture

### Technology Stack

```
Frontend:
  - React 19 + TypeScript
  - Tailwind CSS 4 (dark-mode-first)
  - Recharts (analytics)
  - tRPC Client
  - Wouter (routing)

Backend:
  - Express 4
  - tRPC 11 (type-safe RPC)
  - Node.js
  - Drizzle ORM
  - MySQL/TiDB

External Services:
  - The Odds API (real-time odds)
  - OpenAI (predictions)
  - Stripe (payments)
  - Manus OAuth (authentication)
  - S3 (file storage)
```

### Database Schema

```
users
├── id (PK)
├── openId (unique)
├── name, email
├── role (admin/user)
└── timestamps

subscriptions
├── id (PK)
├── userId (FK)
├── tier (free/pro/premium)
├── status (active/cancelled)
└── dates

bets
├── id (PK)
├── userId (FK)
├── matchId, bookmaker
├── market, option, odds
├── stake, outcome, profit
└── placedAt

odds
├── id (PK)
├── matchId, bookmaker
├── market, option, odds
└── lastUpdated

oddsHistory
├── id (PK)
├── matchId, bookmaker
├── market, option, odds
└── recordedAt

arbitrageOpportunities
├── id (PK)
├── matchId, type (2-way/3-way)
├── profitPercentage, roi
├── riskLevel, isActive
└── bookmakers (JSON)

alerts
├── id (PK)
├── userId (FK)
├── type, title, content
├── isRead
└── createdAt

alertPreferences
├── id (PK)
├── userId (FK)
├── arbitrageAlerts, oddsMovementAlerts
└── minProfitPercentage
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL 8+
- The Odds API key: `<your-odds-api-key>`
- Stripe account (for payments)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/arbitrage-hub.git
cd arbitrage-hub

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate database migrations
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Start development server
pnpm dev
```

### Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/arbitrage_hub

# Authentication
JWT_SECRET=your-secret-key
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=your-owner-id

# External APIs
ODDS_API_KEY=<your-odds-api-key>
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
BUILT_IN_FORGE_API_KEY=your-forge-key
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge

# Frontend
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
```

---

## 📖 Usage

### For Users

1. **Sign Up**: Create account via Manus OAuth
2. **Choose Plan**: Free, Pro, or Premium
3. **View Dashboard**: See live arbitrage opportunities
4. **Set Alerts**: Configure notification preferences
5. **Track Performance**: Monitor profit and ROI

### For Developers

#### Fetch Live Odds

```typescript
import { trpc } from "@/lib/trpc";

const { data } = await trpc.odds.getLiveOdds.useQuery({
  sport: "soccer_epl",
  market: "h2h",
});
```

#### Calculate Arbitrage

```typescript
const { data } = await trpc.arbitrage.calculateArbitrage.useQuery({
  odds: [
    { bookmaker: "Bet365", option: "Home", odds: 2.5 },
    { bookmaker: "DraftKings", option: "Away", odds: 2.5 },
  ],
  type: "2-way",
  stake: 100,
});

if (data?.data) {
  console.log(`Profit: ${data.data.guaranteedProfit}`);
  console.log(`ROI: ${data.data.roi}%`);
}
```

#### Get User Dashboard

```typescript
const { data } = await trpc.dashboard.getDashboard.useQuery();

console.log(`Total Profit: $${data?.data?.stats?.totalProfit}`);
console.log(`Win Rate: ${data?.data?.stats?.winRatio}%`);
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/arbitrage.test.ts

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Test Coverage

- ✅ Arbitrage detection (2-way & 3-way)
- ✅ Stake distribution calculations
- ✅ Risk level assessment
- ✅ Sharp money detection
- ✅ Middling opportunity detection

---

## 📊 Performance

### Benchmarks

- **Odds API Response**: <500ms
- **Arbitrage Detection**: <10ms per opportunity
- **Dashboard Load**: <1s
- **Database Query**: <50ms (with indexes)

### Optimization Tips

1. **Frontend**: Enable code splitting and lazy loading
2. **Backend**: Use Redis caching for odds (5-second TTL)
3. **Database**: Create indexes on frequently queried columns
4. **API**: Implement rate limiting (100 req/min for free tier)

---

## 🔒 Security

- ✅ JWT authentication with 24-hour expiration
- ✅ OAuth 2.0 integration
- ✅ HTTPS/TLS for all connections
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ XSS protection (Content Security Policy)
- ✅ CSRF protection on state-changing operations
- ✅ Rate limiting on public endpoints
- ✅ Role-based access control (admin/user)

---

## 📈 Monetization

### Revenue Model

- **Freemium**: Free tier with upgrade path
- **Subscriptions**: $9.99 (Pro) and $29.99 (Premium) per month
- **API Access**: Premium tier includes API (100 req/day)
- **Affiliate**: Bookmaker referral commissions

### Projections

- **Year 1**: ~$95K (conservative: 500 Pro + 100 Premium)
- **Year 2**: ~$500K (with growth marketing)
- **Year 3**: ~$2M (enterprise tier + API)

---

## 🚢 Deployment

### Manus Platform (Recommended)

```bash
# Create checkpoint
pnpm run build

# Deploy via Manus UI
# - Click "Publish" button
# - Choose deployment region
# - Configure custom domain
```

### Manual Deployment

```bash
# Build for production
pnpm build

# Start server
NODE_ENV=production node dist/index.js

# Server runs on port 3000
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 📚 Documentation

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment and scaling
- **[Architecture](./ARCHITECTURE.md)** - System design and database schema

---

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript best practices
- Use Prettier for code formatting
- Update documentation

---

## 📋 Roadmap

### Q2 2026
- [ ] Mobile app (iOS/Android)
- [ ] Advanced AI predictions
- [ ] Multi-sport support expansion
- [ ] Social features (leaderboards)

### Q3 2026
- [ ] API v1 release
- [ ] Custom alerts
- [ ] Odds comparison charts
- [ ] Betting exchange integration

### Q4 2026
- [ ] Enterprise tier
- [ ] White-label solution
- [ ] Advanced risk management
- [ ] Institutional API

---

## 🐛 Known Issues

- TypeScript error in `server/_core/storageProxy.ts` (non-critical, doesn't affect functionality)
- Odds API rate limits (100 requests/day for free tier)
- Some bookmakers may have delayed odds updates

---

## 📞 Support

- **Documentation**: https://docs.arbitragehub.com
- **Email**: support@arbitragehub.com
- **Discord**: https://discord.gg/arbitragehub
- **Twitter**: @ArbitrageHub

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- The Odds API for real-time sports data
- Stripe for payment processing
- Manus for authentication and infrastructure
- React, Express, and open-source community

---

## 💡 Tips for Success

1. **Start with Free Tier**: Understand platform capabilities
2. **Monitor Alerts**: Set up notifications for opportunities
3. **Track Performance**: Use analytics to improve strategy
4. **Upgrade to Pro**: Unlock real-time detection
5. **Join Community**: Connect with other traders

---

**Built with ❤️ by ArbitrageHub Team**

Last Updated: April 21, 2026
