# ArbitrageHub - Testing Guide

## Overview

This guide covers testing strategies for the ArbitrageHub platform, including unit tests, integration tests, and end-to-end tests.

---

## Running Tests

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/arbitrage.test.ts

# Watch mode
pnpm test --watch

# Coverage report
pnpm test --coverage
```

### Test Files

- `server/arbitrage.test.ts` - Arbitrage detection algorithms (16 tests)
- `server/auth.logout.test.ts` - Authentication flows
- `server/odds.test.ts` - Odds API integration

---

## Test Coverage

### Arbitrage Detection (✅ 16/16 passing)

**2-Way Arbitrage Tests**:
- ✅ Detects profitable 2-way arbitrage
- ✅ Calculates correct stake distribution
- ✅ Computes guaranteed profit
- ✅ Calculates ROI percentage
- ✅ Assesses risk level (low/medium/high)
- ✅ Handles edge cases (negative profit)

**3-Way Arbitrage Tests**:
- ✅ Detects profitable 3-way arbitrage
- ✅ Calculates optimal stake distribution
- ✅ Handles draw option correctly
- ✅ Computes guaranteed profit
- ✅ Calculates ROI percentage
- ✅ Assesses risk level

**Advanced Features**:
- ✅ Sharp money detection
- ✅ Surebet opportunity detection
- ✅ Middling opportunity detection
- ✅ Odds efficiency analysis

---

## Manual Testing Checklist

### Authentication Flow

- [ ] Sign up with email
- [ ] Login with credentials
- [ ] Logout successfully
- [ ] Session persists on page refresh
- [ ] Unauthorized access redirects to login

### Odds Aggregation

- [ ] Odds load from The Odds API
- [ ] Odds update every 5 seconds
- [ ] Multi-bookmaker comparison works
- [ ] Best odds highlighted correctly
- [ ] Odds history tracks changes

### Arbitrage Detection

- [ ] 2-way arbitrage detected correctly
- [ ] 3-way arbitrage detected correctly
- [ ] Profit calculations are accurate
- [ ] ROI displayed correctly
- [ ] Risk levels assigned appropriately
- [ ] Stake distribution is optimal

### Dashboard

- [ ] Dashboard loads without errors
- [ ] User stats display correctly
- [ ] Charts render with sample data
- [ ] Betting history shows records
- [ ] Alerts display properly

### Subscription

- [ ] Free tier features work
- [ ] Pro tier features unlock
- [ ] Premium tier features unlock
- [ ] Tier-based access control works
- [ ] Upgrade flow functions

### Alerts

- [ ] Alerts display in notification center
- [ ] Unread count updates
- [ ] Alert preferences save
- [ ] Alerts filter by type
- [ ] Alerts clear when read

---

## Performance Testing

### Load Testing

```bash
# Simulate 100 concurrent users
# Use Apache Bench or similar tool
ab -n 1000 -c 100 https://api.arbitragehub.com/api/trpc/odds.getLiveOdds

# Expected response time: <500ms
# Expected success rate: >99%
```

### Database Performance

```sql
-- Check query performance
EXPLAIN SELECT * FROM arbitrage_opportunities 
WHERE is_active = true 
ORDER BY profit_percentage DESC 
LIMIT 50;

-- Expected: <50ms response time
```

### Frontend Performance

- Lighthouse score: >90
- First Contentful Paint: <2s
- Largest Contentful Paint: <3s
- Cumulative Layout Shift: <0.1

---

## Security Testing

### Authentication

- [ ] JWT tokens expire correctly
- [ ] Refresh tokens work
- [ ] Session cookies are secure (HttpOnly, Secure, SameSite)
- [ ] CSRF protection active
- [ ] Rate limiting on login endpoint

### Authorization

- [ ] Users can't access other users' data
- [ ] Admin-only endpoints protected
- [ ] Subscription tier restrictions enforced
- [ ] Role-based access control works

### Input Validation

- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] CSRF tokens validated
- [ ] File upload validation
- [ ] Rate limiting active

### API Security

- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] API keys not exposed
- [ ] Sensitive data encrypted
- [ ] Logs don't contain secrets

---

## Integration Testing

### Odds API Integration

```typescript
// Test odds fetching
import { fetchLiveOdds } from "@/server/oddsService";

describe("Odds API Integration", () => {
  it("fetches live odds successfully", async () => {
    const odds = await fetchLiveOdds("soccer_epl", "h2h");
    expect(odds).toBeDefined();
    expect(odds.length).toBeGreaterThan(0);
    expect(odds[0].bookmakers).toBeDefined();
  });

  it("handles API errors gracefully", async () => {
    // Test error handling
  });
});
```

### Database Integration

```typescript
// Test database operations
describe("Database Operations", () => {
  it("creates user subscription", async () => {
    const subscription = await createSubscription({
      userId: 1,
      tier: "pro",
      status: "active",
    });
    expect(subscription.id).toBeDefined();
  });

  it("retrieves user bets", async () => {
    const bets = await getUserBets(1);
    expect(Array.isArray(bets)).toBe(true);
  });
});
```

---

## End-to-End Testing

### User Journey: Finding Arbitrage

1. User logs in
2. Dashboard loads with live odds
3. Arbitrage opportunities display
4. User clicks on opportunity
5. Details modal opens
6. User can place bet
7. Bet recorded in history
8. Analytics updated

### User Journey: Subscription Upgrade

1. User views pricing page
2. Clicks "Upgrade to Pro"
3. Stripe checkout opens
4. User enters payment details
5. Payment processed
6. Subscription activated
7. Pro features unlock
8. User sees confirmation

---

## Browser Testing

### Supported Browsers

- [ ] Chrome 120+
- [ ] Firefox 121+
- [ ] Safari 17+
- [ ] Edge 120+

### Mobile Testing

- [ ] iPhone 14+
- [ ] Android 13+
- [ ] Tablet (iPad, Android tablets)
- [ ] Responsive design works

---

## Regression Testing

### Critical Paths

- [ ] User authentication
- [ ] Odds aggregation
- [ ] Arbitrage detection
- [ ] Dashboard display
- [ ] Subscription management
- [ ] Payment processing

### Automated Regression Suite

```bash
# Run critical path tests
pnpm test --grep "critical"

# Expected: All tests pass in <30s
```

---

## Staging Environment Testing

### Pre-Production Checklist

- [ ] All tests passing
- [ ] TypeScript compilation clean
- [ ] No console errors
- [ ] No console warnings
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] Database migrations applied
- [ ] Environment variables configured

### Staging Deployment

```bash
# Deploy to staging
git push staging main

# Run smoke tests
pnpm test:smoke

# Monitor logs
tail -f logs/staging.log
```

---

## Production Monitoring

### Health Checks

```bash
# Check API health
curl https://api.arbitragehub.com/health

# Expected response:
# { "status": "ok", "timestamp": "2026-04-21T00:00:00Z" }
```

### Error Tracking

- Sentry integration for error monitoring
- Alert on error rate >1%
- Alert on response time >1s
- Alert on database connection failures

### Logging

- Application logs: `/var/log/arbitrage-hub/app.log`
- Error logs: `/var/log/arbitrage-hub/error.log`
- Access logs: `/var/log/arbitrage-hub/access.log`

---

## Test Data

### Sample Odds

```typescript
const sampleOdds = [
  {
    bookmaker: "Bet365",
    market: "h2h",
    outcomes: [
      { option: "Home", odds: 2.5 },
      { option: "Away", odds: 2.5 },
    ],
  },
  {
    bookmaker: "DraftKings",
    market: "h2h",
    outcomes: [
      { option: "Home", odds: 2.4 },
      { option: "Away", odds: 2.6 },
    ],
  },
];
```

### Sample User

```typescript
const testUser = {
  id: 1,
  openId: "test-user-123",
  name: "Test User",
  email: "test@example.com",
  role: "user",
};
```

---

## Known Issues

### Non-Critical

- TypeScript error in `server/_core/storageProxy.ts` (doesn't affect functionality)
- Some Odds API endpoints have rate limits

### Workarounds

- Ignore storageProxy TypeScript error in CI/CD
- Implement caching for Odds API calls
- Use mock data in development

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "22"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm test
      - run: pnpm check
```

---

## Support & Debugging

### Common Issues

**Tests failing locally but passing in CI**:
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check environment variables
- Verify database connection

**Performance issues**:
- Check database indexes
- Monitor memory usage
- Profile slow queries

**Authentication issues**:
- Verify JWT secret
- Check OAuth configuration
- Clear browser cookies

---

## Conclusion

Regular testing ensures platform reliability and user satisfaction. Run tests before every deployment and monitor production continuously.

For questions or issues, contact: qa@arbitragehub.com
