# ArbitrageHub API Documentation

## Overview

ArbitrageHub provides a comprehensive tRPC API for real-time sports arbitrage detection, odds aggregation, and betting analytics. All endpoints are available at `/api/trpc/`.

---

## Authentication

All protected endpoints require a valid JWT token in the session cookie (`__session`). Authentication is handled automatically via Manus OAuth.

### Public Endpoints
- `odds.getLiveOdds`
- `odds.getBestOdds`
- `arbitrage.getOpportunities`
- `arbitrage.calculateArbitrage`
- `subscription.getPlans`

### Protected Endpoints
- `dashboard.getDashboard`
- `dashboard.getBettingHistory`
- `dashboard.getStats`
- `alerts.getAlerts`
- `alerts.getUnreadCount`
- `alerts.getPreferences`
- `subscription.getCurrent`

---

## API Endpoints

### Odds Router

#### `odds.getLiveOdds`

Fetch live odds for a specific sport.

**Request**:
```typescript
{
  sport: string; // e.g., "soccer_epl", "soccer_uefa_champs_league"
  market: string; // e.g., "h2h" (head-to-head)
}
```

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    matchId: string;
    sport: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
    bookmakers: Array<{
      bookmaker: string;
      bookmakerKey: string;
      markets: Array<{
        market: string;
        outcomes: Array<{
          option: string;
          odds: number;
        }>;
      }>;
    }>;
  }>;
}
```

**Example**:
```typescript
const { data } = await trpc.odds.getLiveOdds.useQuery({
  sport: "soccer_epl",
  market: "h2h",
});
```

---

#### `odds.getBestOdds`

Get the best odds for each outcome across all bookmakers.

**Request**:
```typescript
{
  sport: string;
  market: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    option: string;
    odds: number;
    bookmaker: string;
  }>;
}
```

**Example**:
```typescript
const { data } = await trpc.odds.getBestOdds.useQuery({
  sport: "soccer_epl",
});
```

---

### Arbitrage Router

#### `arbitrage.getOpportunities`

Get active arbitrage opportunities, optionally filtered by risk level.

**Request**:
```typescript
{
  limit: number; // default: 50
  riskLevel?: "low" | "medium" | "high";
}
```

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    matchId: string;
    type: "2-way" | "3-way";
    profitPercentage: number;
    roi: number;
    riskLevel: "low" | "medium" | "high";
    bookmakers: Array<{
      bookmaker: string;
      option: string;
      odds: number;
    }>;
    isActive: boolean;
    createdAt: Date;
  }>;
}
```

**Example**:
```typescript
const { data } = await trpc.arbitrage.getOpportunities.useQuery({
  limit: 20,
  riskLevel: "low",
});
```

---

#### `arbitrage.calculateArbitrage`

Calculate arbitrage for custom odds.

**Request**:
```typescript
{
  odds: Array<{
    bookmaker: string;
    option: string;
    odds: number;
  }>;
  type: "2-way" | "3-way";
  stake: number; // default: 100
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    type: "2-way" | "3-way";
    profitPercentage: number;
    roi: number;
    guaranteedProfit: number;
    riskLevel: "low" | "medium" | "high";
    bookmakers: Array<{
      bookmaker: string;
      option: string;
      odds: number;
      stake: number;
    }>;
  } | null;
}
```

**Example**:
```typescript
const { data } = await trpc.arbitrage.calculateArbitrage.useQuery({
  odds: [
    { bookmaker: "Bet365", option: "Home", odds: 2.5 },
    { bookmaker: "DraftKings", option: "Away", odds: 2.5 },
  ],
  type: "2-way",
  stake: 100,
});
```

---

### Dashboard Router

#### `dashboard.getDashboard`

Get user's complete dashboard data (protected).

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: {
    stats: {
      totalBets: number;
      wonBets: number;
      lostBets: number;
      winRatio: number;
      totalProfit: number;
      averageProfit: number;
    };
    subscription: {
      id: number;
      userId: number;
      tier: "free" | "pro" | "premium";
      status: "active" | "cancelled";
      createdAt: Date;
      expiresAt: Date;
    } | null;
    recentBets: Array<{
      id: number;
      userId: number;
      matchId: string;
      bookmaker: string;
      market: string;
      option: string;
      stake: number;
      odds: number;
      outcome: "won" | "lost" | "pending";
      profit: number;
      placedAt: Date;
    }>;
    alerts: Array<{
      id: number;
      userId: number;
      type: "arbitrage" | "odds_movement" | "prediction";
      title: string;
      content: string;
      isRead: boolean;
      createdAt: Date;
    }>;
  };
}
```

**Example**:
```typescript
const { data } = await trpc.dashboard.getDashboard.useQuery();
```

---

#### `dashboard.getBettingHistory`

Get user's betting history (protected).

**Request**:
```typescript
{
  limit: number; // default: 50
}
```

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    userId: number;
    matchId: string;
    bookmaker: string;
    market: string;
    option: string;
    stake: number;
    odds: number;
    outcome: "won" | "lost" | "pending";
    profit: number;
    placedAt: Date;
  }>;
}
```

---

#### `dashboard.getStats`

Get user's statistics (protected).

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: {
    totalBets: number;
    wonBets: number;
    lostBets: number;
    winRatio: number;
    totalProfit: number;
    averageProfit: number;
  };
}
```

---

### Alerts Router

#### `alerts.getAlerts`

Get user's alerts (protected).

**Request**:
```typescript
{
  limit: number; // default: 50
}
```

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    id: number;
    userId: number;
    type: "arbitrage" | "odds_movement" | "prediction";
    title: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
  }>;
}
```

---

#### `alerts.getUnreadCount`

Get count of unread alerts (protected).

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: number;
}
```

---

#### `alerts.getPreferences`

Get user's alert preferences (protected).

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: {
    id: number;
    userId: number;
    arbitrageAlerts: boolean;
    oddsMovementAlerts: boolean;
    predictionAlerts: boolean;
    minProfitPercentage: number;
    createdAt: Date;
  } | null;
}
```

---

### Subscription Router

#### `subscription.getCurrent`

Get user's current subscription (protected).

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: {
    id: number;
    userId: number;
    tier: "free" | "pro" | "premium";
    status: "active" | "cancelled";
    createdAt: Date;
    expiresAt: Date;
  } | null;
}
```

---

#### `subscription.getPlans`

Get available subscription plans.

**Request**: None

**Response**:
```typescript
{
  success: boolean;
  data: Array<{
    id: string;
    name: string;
    price: number;
    features: string[];
  }>;
}
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "features": [
        "Limited odds aggregation (5 bookmakers)",
        "Delayed arbitrage detection (15 min)",
        "Basic match center",
        "Limited alerts (5/day)"
      ]
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 9.99,
      "features": [
        "Full odds aggregation (50+ bookmakers)",
        "Real-time arbitrage detection",
        "Full match center with stats",
        "Unlimited alerts",
        "Advanced analytics"
      ]
    },
    {
      "id": "premium",
      "name": "Premium",
      "price": 29.99,
      "features": [
        "Everything in Pro",
        "AI-powered predictions",
        "Custom models",
        "Priority support",
        "API access",
        "Sharp money detection"
      ]
    }
  ]
}
```

---

## Error Handling

All endpoints return errors in the following format:

```typescript
{
  success: false;
  error: string;
  data: null;
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks required permissions
- `BAD_REQUEST`: Invalid input parameters
- `NOT_FOUND`: Resource not found
- `INTERNAL_SERVER_ERROR`: Server error

---

## Rate Limiting

- **Free Tier**: 100 requests/minute
- **Pro Tier**: 1,000 requests/minute
- **Premium Tier**: 10,000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Pagination

For endpoints returning large datasets:

```typescript
{
  limit: number;
  offset: number;
}
```

Response includes:
```typescript
{
  success: boolean;
  data: Array<T>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

---

## WebSocket Events (Real-Time)

For real-time updates, connect to WebSocket at `wss://api.arbitragehub.com/ws`:

### Subscribe to Events

```typescript
socket.emit("subscribe:odds", { matchId: "match123" });
socket.emit("subscribe:arbitrage", {});
socket.emit("subscribe:alerts", {});
```

### Receive Events

```typescript
socket.on("odds:update", (data) => {
  // New odds available
});

socket.on("arbitrage:new", (opportunity) => {
  // New arbitrage opportunity
});

socket.on("alert:new", (alert) => {
  // New alert for user
});
```

---

## SDK Usage

### JavaScript/TypeScript

```typescript
import { trpc } from "@/lib/trpc";

// Query odds
const odds = await trpc.odds.getLiveOdds.useQuery({
  sport: "soccer_epl",
});

// Calculate arbitrage
const arb = await trpc.arbitrage.calculateArbitrage.useQuery({
  odds: [
    { bookmaker: "Bet365", option: "Home", odds: 2.5 },
    { bookmaker: "DraftKings", option: "Away", odds: 2.5 },
  ],
  type: "2-way",
  stake: 100,
});

// Get dashboard
const dashboard = await trpc.dashboard.getDashboard.useQuery();
```

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Odds aggregation
- Arbitrage detection (2-way & 3-way)
- User dashboard
- Alerts system
- Subscription management

### v1.1.0 (Planned)
- WebSocket support
- Advanced filtering
- Historical data export
- Custom alerts

### v2.0.0 (Planned)
- REST API alongside tRPC
- GraphQL support
- Webhooks
- Batch operations

---

## Support

For API questions and issues:
- Documentation: https://docs.arbitragehub.com
- Email: api-support@arbitragehub.com
- Discord: https://discord.gg/arbitragehub
