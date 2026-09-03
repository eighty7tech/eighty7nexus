# Ghana Localized Checkout - Implementation Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
4. [Technical Architecture](#technical-architecture)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Strategy](#deployment-strategy)
7. [Monitoring & Operations](#monitoring--operations)

---

## Getting Started

### Prerequisites
- Node.js 18+ LTS
- MongoDB 6.0+
- Redis 7.0+
- Google Maps API key
- Payment gateway credentials (MTN, Vodafone)
- GitHub repository with CI/CD setup

### Project Structure
```
eighty7-nexus/
├── app/
│   └── api/
│       ├── ghana-checkout/
│       ├── delivery-methods/
│       ├── pickup-stations/
│       ├── tracking/
│       └── routing/
├── components/
│   ├── checkout/
│   │   ├── region-selector/
│   │   ├── address-input/
│   │   ├── delivery-method-selector/
│   │   └── pickup-station-selector/
│   └── driver/
│       ├── dashboard/
│       ├── tracking/
│       └── delivery-complete/
├── lib/
│   ├── ghana-regions.ts
│   ├── delivery-cost-calculator.ts
│   ├── route-optimizer.ts
│   ├── gps-tracker.ts
│   └── notifications.ts
├── models/
│   ├── ghana-region.model.ts
│   ├── delivery-method.model.ts
│   ├── pickup-station.model.ts
│   ├── shipment.model.ts
│   └── driver.model.ts
├── hooks/
│   └── use-ghana-checkout.ts
└── public/
    └── locales/
        └── ghana-specific-strings/
```

---

## Development Environment Setup

### 1. Local Database Setup

**MongoDB:**
```bash
# Docker setup
docker run -d \
  --name ghana-checkout-db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -p 27017:27017 \
  mongo:6.0

# Connection string
mongodb://admin:password@localhost:27017/ghana-checkout?authSource=admin
```

**Redis:**
```bash
# Docker setup
docker run -d \
  --name ghana-checkout-redis \
  -p 6379:6379 \
  redis:7.0

# Connection string
redis://localhost:6379
```

### 2. Environment Variables

```env
# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/ghana-checkout
REDIS_URL=redis://localhost:6379

# APIs
GOOGLE_MAPS_API_KEY=your_key_here
PAYMENT_GATEWAY_API_KEY=your_key_here

# Services
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_TRACKING_WS=ws://localhost:3000

# Features
ENABLE_TRACKING=true
ENABLE_ROUTING=true
ENABLE_ML=false (for MVP)
```

### 3. Development Server

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint
```

---

## Phase-by-Phase Implementation

### Phase 1: Data Models & Infrastructure (3 Days)

#### Task 1.1: Create Database Models

**GhanaRegion Model:**
```typescript
// models/ghana-region.model.ts
import mongoose from 'mongoose';

interface IDistrict {
  code: string;
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface IGhanaRegion {
  code: string;
  name: string;
  districts: IDistrict[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

const ghanaRegionSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  districts: [{
    code: String,
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }],
  coordinates: {
    latitude: Number,
    longitude: Number
  }
}, { timestamps: true });

// Add geospatial index
ghanaRegionSchema.index({ 'coordinates': '2dsphere' });

export const GhanaRegion = mongoose.model('GhanaRegion', ghanaRegionSchema);
```

**Seed Ghana Regions:**
```typescript
// scripts/seed-ghana-regions.ts
const ghanaRegions = [
  {
    code: 'GR',
    name: 'Greater Accra',
    coordinates: { latitude: 5.5500, longitude: -0.1955 },
    districts: [
      { code: 'GA-001', name: 'Accra Metropolitan', coordinates: { latitude: 5.5500, longitude: -0.2000 } },
      { code: 'GA-002', name: 'Tema Metropolitan', coordinates: { latitude: 5.6140, longitude: -0.0222 } },
      // ... more districts
    ]
  },
  {
    code: 'ART',
    name: 'Ashanti',
    coordinates: { latitude: 6.6163, longitude: -1.6100 },
    districts: [
      { code: 'A-001', name: 'Kumasi Metropolitan', coordinates: { latitude: 6.6163, longitude: -1.6100 } },
      // ... more districts
    ]
  },
  // ... remaining 14 regions
];

// Insert into database
for (const region of ghanaRegions) {
  await GhanaRegion.create(region);
}
```

#### Task 1.2: Create Delivery Method Model

```typescript
// models/delivery-method.model.ts
interface IDeliveryMethod {
  name: string;
  type: 'FLAT_RATE' | 'PER_KM' | 'PER_KG' | 'ZONE_BASED';
  baseCost: number;
  perKmCost?: number;
  perKgCost?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  availableRegions: string[];
  isActive: boolean;
}

const deliveryMethodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['FLAT_RATE', 'PER_KM', 'PER_KG', 'ZONE_BASED'], required: true },
  baseCost: { type: Number, required: true },
  perKmCost: Number,
  perKgCost: Number,
  estimatedDaysMin: { type: Number, required: true },
  estimatedDaysMax: { type: Number, required: true },
  availableRegions: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const DeliveryMethod = mongoose.model('DeliveryMethod', deliveryMethodSchema);
```

#### Task 1.3: Create API Endpoints

```typescript
// app/api/ghana-checkout/regions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GhanaRegion } from '@/models/ghana-region.model';

export async function GET(request: NextRequest) {
  try {
    const regions = await GhanaRegion.find().select('code name');
    return NextResponse.json(regions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
  }
}
```

### Phase 2: Checkout Flow UI (5-6 Days)

#### Task 2.1: Region Selector Component

```typescript
// components/checkout/region-selector/RegionSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { useGhanaCheckout } from '@/hooks/use-ghana-checkout';

export function RegionSelector() {
  const [regions, setRegions] = useState([]);
  const { selectedRegion, setSelectedRegion } = useGhanaCheckout();

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    const response = await fetch('/api/ghana-checkout/regions');
    const data = await response.json();
    setRegions(data);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Select Region</label>
      <select
        value={selectedRegion || ''}
        onChange={(e) => setSelectedRegion(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      >
        <option value="">Choose a region...</option>
        {regions.map((region) => (
          <option key={region.code} value={region.code}>
            {region.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

#### Task 2.2: GhanaPost GPS Address Input

```typescript
// components/checkout/address-input/GhanaPostAddressInput.tsx
'use client';

import { useState } from 'react';

const GHANAPOST_GPS_REGEX = /^GA-\d{3}-\d{4}$/;

export function GhanaPostAddressInput() {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleChange = (value: string) => {
    setAddress(value.toUpperCase());
    
    if (value && !GHANAPOST_GPS_REGEX.test(value)) {
      setError('Invalid GhanaPost GPS format. Use GA-XXX-XXXX');
    } else {
      setError('');
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">GhanaPost GPS Address</label>
      <input
        type="text"
        placeholder="GA-123-4567"
        value={address}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full px-4 py-2 border rounded-lg ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
```

### Phase 3: Cost Calculation Engine (3 Days)

#### Task 3.1: Haversine Distance Calculator

```typescript
// lib/delivery-cost-calculator.ts
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in km
}

export function calculateDeliveryCost(
  distance: number,
  weight: number,
  deliveryMethod: IDeliveryMethod
): number {
  let cost = deliveryMethod.baseCost;
  
  if (deliveryMethod.type === 'PER_KM') {
    cost += distance * (deliveryMethod.perKmCost || 0);
  } else if (deliveryMethod.type === 'PER_KG') {
    cost += weight * (deliveryMethod.perKgCost || 0);
  } else if (deliveryMethod.type === 'ZONE_BASED') {
    // Zone-based pricing logic
    const zone = getZoneFromDistance(distance);
    cost = getZonePrice(zone, deliveryMethod);
  }
  
  return Math.round(cost * 100) / 100; // Round to 2 decimals
}
```

#### Task 3.2: Real-time Cost Updates API

```typescript
// app/api/ghana-checkout/calculate-cost/route.ts
export async function POST(request: NextRequest) {
  const { distance, weight, deliveryMethodId, origin, destination } = await request.json();

  try {
    const deliveryMethod = await DeliveryMethod.findById(deliveryMethodId);
    
    if (!deliveryMethod) {
      return NextResponse.json({ error: 'Delivery method not found' }, { status: 404 });
    }

    const cost = calculateDeliveryCost(distance, weight, deliveryMethod);
    const tax = cost * 0.075; // 7.5% tax
    const total = cost + tax;

    return NextResponse.json({
      cost,
      tax,
      total,
      estimatedDays: {
        min: deliveryMethod.estimatedDaysMin,
        max: deliveryMethod.estimatedDaysMax
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate cost' }, { status: 500 });
  }
}
```

---

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Web App (Next.js)  │  Driver App (React Native)  │  Admin (Next.js) │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Rate Limiting  │  Authentication  │  Request Validation       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│ Checkout Service │ Tracking Service │ Routing Service         │
│ Payment Service  │ Notification Service │ Analytics Service   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB (Persistent) │  Redis (Cache)  │  Elasticsearch       │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema Relationships

```
GhanaRegion (1) ──→ (Many) District
    ↓
DeliveryMethod ──→ Shipment
    ↓
PickupStation ──→ Shipment
    ↓
Driver ──→ Shipment
    ↓
Order ──→ Shipment
```

### API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ghana-checkout/regions` | List all regions |
| GET | `/api/ghana-checkout/regions/:code/districts` | List districts for region |
| POST | `/api/ghana-checkout/calculate-cost` | Calculate delivery cost |
| GET | `/api/ghana-checkout/delivery-methods` | List available methods |
| GET | `/api/ghana-checkout/pickup-stations` | List nearby pickup stations |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/:id/tracking` | Get order tracking info |

---

## Testing Strategy

### Unit Tests

```typescript
// lib/__tests__/delivery-cost-calculator.test.ts
describe('calculateHaversineDistance', () => {
  it('should calculate distance correctly between two points', () => {
    const distance = calculateHaversineDistance(5.5500, -0.1955, 6.6163, -1.6100);
    expect(distance).toBeCloseTo(127, 0); // Accra to Kumasi ~127 km
  });
});

describe('calculateDeliveryCost', () => {
  it('should calculate cost for PER_KM delivery', () => {
    const method = { type: 'PER_KM', baseCost: 5, perKmCost: 2 };
    const cost = calculateDeliveryCost(10, 2, method);
    expect(cost).toBe(25); // 5 + (10 * 2)
  });
});
```

### Integration Tests

```typescript
// __tests__/api/checkout.integration.test.ts
describe('Checkout API', () => {
  it('should calculate cost end-to-end', async () => {
    const response = await fetch('/api/ghana-checkout/calculate-cost', {
      method: 'POST',
      body: JSON.stringify({
        distance: 10,
        weight: 2,
        deliveryMethodId: 'method-id'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.total).toBeGreaterThan(0);
  });
});
```

### E2E Tests

```typescript
// e2e/checkout.spec.ts
describe('Checkout Flow', () => {
  it('should complete full checkout', () => {
    cy.visit('/checkout');
    
    // Select region
    cy.get('[data-testid="region-select"]').select('GR');
    
    // Enter address
    cy.get('[data-testid="address-input"]').type('GA-123-4567');
    
    // Select delivery method
    cy.get('[data-testid="delivery-method"]').select('standard');
    
    // Complete order
    cy.get('[data-testid="place-order"]').click();
    
    cy.contains('Order placed successfully').should('be.visible');
  });
});
```

---

## Deployment Strategy

### Development Deployment

```bash
# Push to dev branch
git push origin dev

# GitHub Actions triggers:
# 1. Run tests
# 2. Build Docker image
# 3. Deploy to dev environment
# 4. Run smoke tests
```

### Production Deployment

```bash
# Merge to main branch with PR
git checkout main
git pull origin main
git merge --no-ff develop
git push origin main

# GitHub Actions triggers:
# 1. Run full test suite
# 2. Build optimized Docker image
# 3. Deploy to staging
# 4. Run E2E tests
# 5. Deploy to production (manual approval)
# 6. Monitor for 1 hour
# 7. Auto-rollback if error rate > 1%
```

### Infrastructure Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: ghana-checkout:latest
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6.0
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7.0
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

---

## Monitoring & Operations

### Key Metrics to Monitor

```javascript
// Instrumentation setup
import { Prometheus } from 'prom-client';

const httpRequestDuration = new Prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const deliverySuccessRate = new Prometheus.Gauge({
  name: 'delivery_success_rate',
  help: 'Percentage of successful deliveries'
});

const databaseQueryDuration = new Prometheus.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries'
});
```

### Alerting Rules

```yaml
# prometheus-rules.yml
groups:
  - name: ghana_checkout
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m

      - alert: SlowDeliveryCalculation
        expr: delivery_cost_calculation_duration_seconds > 1
        for: 5m

      - alert: DatabaseConnectionPoolExhausted
        expr: mongodb_connection_pool_available < 5
        for: 2m
```

### Logging Strategy

```typescript
// Centralized logging setup
import winston from 'winston';

const logger = winston.createLogger({
  defaultMeta: { service: 'ghana-checkout' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('Order created', { orderId: '123', region: 'GR' });
logger.error('Payment failed', { orderId: '123', error: err });
```

---

## Maintenance & Operations

### Backup Strategy

```bash
# Daily MongoDB backup
0 2 * * * mongodump --uri "mongodb://..." --out /backups/mongo-$(date +\%Y\%m\%d)

# Weekly backup to cloud storage
0 3 * * 0 aws s3 sync /backups s3://backups-bucket/
```

### Performance Tuning

### Database Indexes
```typescript
// Ensure these indexes exist
db.shipments.createIndex({ region: 1, createdAt: -1 });
db.shipments.createIndex({ driverId: 1, status: 1 });
db.shipments.createIndex({ 'location': '2dsphere' });
```

### Cache Strategy
```typescript
// Cache frequently accessed data
const regionsCacheKey = 'regions:all';
const cacheTTL = 3600; // 1 hour

redis.setex(regionsCacheKey, cacheTTL, JSON.stringify(regions));
```

---

## Getting Help & Support

**Documentation:**
- API Docs: `/api/docs`
- Architecture Diagrams: `docs/architecture/`
- Runbooks: `docs/runbooks/`

**Communication:**
- Slack: #ghana-checkout-dev
- Stand-up: Daily 9 AM
- Weekly sync: Friday 4 PM

---

**Next Steps:**
1. Set up development environment
2. Create MongoDB seed data
3. Build Phase 1 components
4. Write tests
5. Deploy to dev environment

**Questions?** Reach out to the project lead or post in #ghana-checkout-dev

---

*Last Updated: September 1, 2026*
*Version: 1.0*
