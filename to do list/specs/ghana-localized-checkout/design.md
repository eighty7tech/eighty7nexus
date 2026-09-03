# Ghana Localized Checkout - Design

## Architecture Overview

### 1. Data Models

#### GhanaRegion Model
```typescript
interface GhanaRegion {
  _id: ObjectId;
  code: string;              // Region code (e.g., "GR" for Greater Accra)
  name: string;              // Region name
  districts: District[];     // District subdivisions
  coordinates?: GeoPoint;    // Geographic center
  createdAt: Date;
  updatedAt: Date;
}

interface District {
  code: string;
  name: string;
  coordinates?: GeoPoint;
}
```

#### DeliveryMethod Model
```typescript
interface DeliveryMethod {
  _id: ObjectId;
  name: string;
  type: "FLAT_RATE" | "PER_KM" | "PER_KG" | "ZONE_BASED";
  baseCost: number;
  perKmCost?: number;
  perKgCost?: number;
  maxDistanceKm?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  isInternational: boolean;
  availableRegions: string[];  // Region codes
  createdAt: Date;
  updatedAt: Date;
}
```

#### PickupStation Model
```typescript
interface PickupStation {
  _id: ObjectId;
  name: string;
  region: string;
  district: string;
  address: string;
  location: GeoJSON.Point;   // For geospatial queries
  phone: string;
  operatingHours?: string;
  capacity: number;          // Max parcels
  specialInstructions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Checkout Flow

```
Customer selects Ghana
    ↓
Select Region (dropdown)
    ↓
Select District (filtered by region)
    ↓
Enter GhanaPost GPS Address (GA-XXX-XXXX format)
    ↓
Choose Delivery Method
    ├─ Standard (Regional delivery)
    ├─ Express (Metro delivery)
    └─ Pickup (Select from stations)
    ↓
Confirm Address & Calculate Costs
    ↓
Select Payment Method (Mobile Money, Card, etc.)
    ↓
Place Order
```

### 3. Delivery Cost Calculation

#### Haversine Distance Algorithm
For distance-based pricing:
```
distance = 2 * R * arcsin(sqrt(sin²((lat₂-lat₁)/2) + cos(lat₁) * cos(lat₂) * sin²((lng₂-lng₁)/2)))
where R = Earth's radius (6371 km)
```

#### Cost Formula
```
totalCost = baseCost + (distance * perKmCost) + (weight * perKgCost)
```

### 4. API Endpoints

#### Delivery Methods
- `GET /api/admin/delivery-methods` - List all delivery methods
- `POST /api/admin/delivery-methods` - Create delivery method
- `PUT /api/admin/delivery-methods/:id` - Update delivery method
- `DELETE /api/admin/delivery-methods/:id` - Delete delivery method

#### Pickup Stations
- `GET /api/admin/pickup-stations` - List all pickup stations
- `POST /api/admin/pickup-stations` - Create pickup station
- `PUT /api/admin/pickup-stations/:id` - Update pickup station
- `DELETE /api/admin/pickup-stations/:id` - Delete pickup station

#### Ghana Regions
- `GET /api/public/ghana-regions` - List all regions and districts
- `GET /api/public/ghana-regions/:regionCode/districts` - Get districts for region

### 5. Frontend Components

#### Region/District Selector
```tsx
<RegionSelector
  selectedRegion={region}
  selectedDistrict={district}
  onRegionChange={setRegion}
  onDistrictChange={setDistrict}
/>
```

#### GhanaPost GPS Address Input
```tsx
<GhanaPostAddressInput
  value={address}
  onChange={setAddress}
  onValidate={validateGPS}
/>
```

#### Pickup Station Selector (with Map)
```tsx
<PickupStationSelector
  stations={stations}
  selectedStation={selectedStation}
  onSelect={setSelectedStation}
  showMap={true}
/>
```

### 6. State Management (Zustand)

```typescript
interface CheckoutStore {
  // Location
  selectedCountry: string;
  selectedRegion: string;
  selectedDistrict: string;
  deliveryAddress: string;
  
  // Delivery Mode
  deliveryMode: "standard" | "express" | "pickup";
  selectedPickupStation?: string;
  
  // Costs
  estimatedCost: number;
  estimatedDays: number;
  
  // Payment
  selectedPaymentMethod: string;
  
  // Methods
  setRegion: (region: string) => void;
  setDeliveryMode: (mode: string) => void;
  calculateCost: () => Promise<void>;
}
```

## Testing Requirements

### Property-Based Testing
Property 1: Ghana Phone Number Validation
Property 2: Region/District Consistency
Property 3: GhanaPost GPS Format Validation
Property 4: Delivery Cost Calculation Consistency
Property 5: Address Data Preservation on Form Switch
Property 6: Pickup Station Distance Calculation Accuracy
Property 7: Delivery Cost Calculation Consistency

See `tasks.md` for detailed test specifications.

---

## Advanced Features Architecture

### 6. Real-Time Tracking System

#### Shipment Tracking Model
```typescript
interface Shipment {
  _id: ObjectId;
  orderId: string;
  carrierId: string;
  trackingNumber: string;
  
  // Current Status
  status: ShipmentStatus;
  subStatus: ShipmentSubStatus;
  lastUpdatedAt: Date;
  
  // Location Data
  currentLocation?: GeoJSON.Point;
  lastLocationUpdate: Date;
  
  // Routing
  pickupLocation: GeoJSON.Point;
  deliveryLocation: GeoJSON.Point;
  plannedRoute?: GeoJSON.LineString;
  actualRoute?: GeoJSON.LineString;
  
  // Timing
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  scheduledDeliveryDate: Date;
  
  // Driver Assignment
  assignedDriverId?: string;
  vehicleId?: string;
  
  // Tracking History
  events: TrackingEvent[];
  
  createdAt: Date;
  updatedAt: Date;
}

enum ShipmentStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PICKED_UP = "picked_up",
  IN_TRANSIT = "in_transit",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  RETURNED = "returned",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

enum ShipmentSubStatus {
  AWAITING_PICKUP = "awaiting_pickup",
  AT_ORIGIN_HUB = "at_origin_hub",
  IN_SORTING = "in_sorting",
  EN_ROUTE_HUB = "en_route_hub",
  AT_DESTINATION_HUB = "at_destination_hub",
  OUT_FOR_DELIVERY_TODAY = "out_for_delivery_today",
  DELIVERY_ATTEMPTED = "delivery_attempted",
  AWAITING_PAYMENT = "awaiting_payment",
  DELIVERED_SUCCESSFULLY = "delivered_successfully",
  DELIVERY_FAILED = "delivery_failed",
  HELD_AT_STATION = "held_at_station"
}

interface TrackingEvent {
  _id: ObjectId;
  timestamp: Date;
  status: ShipmentStatus;
  subStatus: ShipmentSubStatus;
  location?: GeoJSON.Point;
  description: string;
  proofUrl?: string;  // Photo of delivery
  metadata?: Record<string, unknown>;
}
```

#### Real-Time Tracking Updates
```typescript
interface GPSUpdate {
  driverId: string;
  vehicleId: string;
  location: GeoJSON.Point;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
  shipmentIds: string[];
}

// WebSocket Event: Push updates to clients
// Topic: "shipment.{trackingNumber}.tracking"
// Payload: { location, eta, status, lastUpdate }
```

### 7. Intelligent Routing Engine

#### Route Optimization Model
```typescript
interface DeliveryRoute {
  _id: ObjectId;
  driverId: string;
  vehicleId: string;
  date: Date;
  
  // Route Planning
  stops: RouteStop[];
  plannedRoute: GeoJSON.LineString;
  optimizationAlgorithm: "TSP" | "NEAREST_NEIGHBOR" | "GENETIC" | "ANT_COLONY";
  
  // Metrics
  totalDistance: number;
  estimatedDuration: number;
  estimatedCost: number;
  
  // Status
  status: "planned" | "in_progress" | "completed" | "paused";
  startTime?: Date;
  endTime?: Date;
  
  // Performance
  actualDistance?: number;
  actualDuration?: number;
  completionRate: number;  // % of deliveries completed
  
  createdAt: Date;
  updatedAt: Date;
}

interface RouteStop {
  sequence: number;
  shipmentId: string;
  deliveryLocation: GeoJSON.Point;
  address: string;
  
  // Time Window
  timeWindowStart: Date;
  timeWindowEnd: Date;
  
  // Status
  status: "pending" | "completed" | "failed" | "skipped";
  completionTime?: Date;
  
  // Delivery Details
  recipientName: string;
  recipientPhone: string;
  proofOfDelivery?: {
    photo?: string;
    signature?: string;
    timestamp: Date;
  };
  failureReason?: string;
}
```

#### TSP Algorithm Implementation
```typescript
// Traveling Salesman Problem solver
function optimizeRoute(
  startingPoint: GeoJSON.Point,
  deliveryPoints: GeoJSON.Point[],
  timeWindows: TimeWindow[],
  constraints: RouteConstraints
): DeliveryRoute {
  // Uses dynamic programming or genetic algorithm
  // Considers:
  // - Distance between points (Haversine)
  // - Time windows constraints
  // - Vehicle capacity
  // - Traffic patterns
  // - Driver work hours
  
  // Returns optimized route with minimum distance/time
}
```

#### Multi-Stop Batching
```typescript
interface DeliveryBatch {
  _id: ObjectId;
  date: Date;
  
  // Batch Composition
  shipmentIds: string[];
  driverId: string;
  vehicleId: string;
  
  // Optimization
  estimatedDistance: number;
  estimatedDuration: number;
  costPerStop: number;
  
  // Status
  status: "planning" | "assigned" | "in_progress" | "completed";
  
  createdAt: Date;
  updatedAt: Date;
}

function createOptimalBatches(
  pendingShipments: Shipment[],
  availableDrivers: Driver[],
  constraints: BatchConstraints
): DeliveryBatch[] {
  // Clusters shipments by:
  // - Geographic proximity
  // - Time windows
  // - Vehicle capacity
  // - Driver availability
  
  // Returns optimized batches
}
```

### 8. Order Status Management

#### Status Lifecycle & Transitions
```typescript
interface StatusTransition {
  _id: ObjectId;
  shipmentId: string;
  fromStatus: ShipmentStatus;
  toStatus: ShipmentStatus;
  reason?: string;
  triggeredBy: "system" | "driver" | "admin" | "customer";
  timestamp: Date;
  metadata?: {
    location?: GeoJSON.Point;
    proofUrl?: string;
    notes?: string;
  };
}

// Valid State Transitions
const STATUS_FLOW = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["picked_up", "cancelled"],
  picked_up: ["in_transit"],
  in_transit: ["out_for_delivery"],
  out_for_delivery: ["delivered", "failed"],
  delivered: ["returned"],
  failed: ["picked_up", "returned"],  // Retry or return
  returned: ["delivered"],  // Re-deliver
};

// Automatic Status Updates based on:
// - Proof of delivery photos
// - GPS location arrival at destination
// - Time window passage
// - Driver actions (mark delivered, etc.)
```

#### Status Notifications
```typescript
interface StatusNotification {
  shipmentId: string;
  customerId: string;
  status: ShipmentStatus;
  channels: ("sms" | "email" | "push" | "whatsapp")[];
  
  // Timing
  scheduledAt: Date;
  sentAt?: Date;
  
  // Content
  messageTemplate: string;
  personalizedData: {
    trackingUrl: string;
    eta?: string;
    driverName?: string;
    driverPhone?: string;
  };
}

// Auto-send notifications on status changes:
// pending → confirmed: "Your order is confirmed"
// picked_up → "Your package is on the way"
// out_for_delivery → "Driver is out for delivery, ETA: {time}"
// delivered → "Package delivered. Rate your experience: {link}"
```

### 9. Driver Management System

#### Driver Profile Model
```typescript
interface Driver {
  _id: ObjectId;
  userId: string;
  
  // Basic Info
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  
  // Vehicle Info
  vehicleId: string;
  vehicleType: "motorcycle" | "tricycle" | "van" | "truck";
  vehicleCapacity: number;  // in kg or items
  
  // Document Management
  licenses: {
    number: string;
    expiryDate: Date;
    type: "A" | "B" | "C" | "D";
  };
  insurance: {
    provider: string;
    policyNumber: string;
    expiryDate: Date;
  };
  backgroundCheck: {
    status: "pending" | "approved" | "rejected";
    completedAt?: Date;
  };
  
  // Availability
  workSchedule: {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    // ... other days
  };
  currentStatus: "offline" | "online" | "on_duty" | "on_break" | "on_trip";
  currentLocation?: GeoJSON.Point;
  
  // Performance
  metrics: {
    totalDeliveries: number;
    onTimeRate: number;  // %
    customerRating: number;  // 1-5
    totalEarnings: number;
    acceptanceRate: number;  // % of offers accepted
  };
  
  // Compliance
  documentsExpirySoon: boolean;
  suspensionStatus: "active" | "suspended" | "terminated";
  suspensionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

interface TimeSlot {
  startTime: string;  // "08:00"
  endTime: string;    // "17:00"
  isActive: boolean;
}
```

#### Driver Performance Dashboard
```typescript
interface DriverMetrics {
  driverId: string;
  period: "daily" | "weekly" | "monthly";
  date: Date;
  
  // Delivery Metrics
  deliveriesCompleted: number;
  deliveriesFailed: number;
  deliveriesReturned: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  
  // Distance & Time
  totalDistance: number;
  totalTime: number;
  averageTimePerStop: number;
  
  // Revenue
  earnings: number;
  incentiveBonus?: number;
  
  // Ratings
  averageCustomerRating: number;
  customerReviews: {
    positive: number;
    negative: number;
    neutral: number;
  };
  
  // Incidents
  accidents: number;
  complaints: number;
  
  // Efficiency
  routeEfficiency: number;  // Actual distance vs optimal
  vehicleUtilization: number;  // % of capacity used
}
```

### 10. Customer Notifications Engine

#### Multi-Channel Notification Service
```typescript
interface NotificationConfig {
  customerId: string;
  
  // Channel Preferences
  sms: {
    enabled: boolean;
    phoneNumber: string;
  };
  email: {
    enabled: boolean;
    emailAddress: string;
  };
  push: {
    enabled: boolean;
    deviceTokens: string[];
  };
  whatsapp: {
    enabled: boolean;
    phoneNumber: string;
  };
  
  // Notification Triggers
  triggers: {
    orderConfirmed: boolean;
    orderDispatched: boolean;
    outForDelivery: boolean;
    delivered: boolean;
    deliveryFailed: boolean;
    etaChanged: boolean;
  };
  
  // Do Not Disturb
  dnd: {
    enabled: boolean;
    startTime: string;  // "20:00"
    endTime: string;    // "09:00"
  };
}

async function sendNotification(
  customerId: string,
  shipmentId: string,
  status: ShipmentStatus,
  channels: string[]
): Promise<void> {
  // Send across SMS, Email, Push, WhatsApp
  // Track delivery status
  // Implement retry logic
  // Handle opt-out preferences
}
```

#### Real-Time Push Notifications
```typescript
// WebSocket Connection
// Client subscribes to: "order.{orderId}.updates"
// Server broadcasts: {
//   status, subStatus, eta, driverInfo,
//   location, notificationMessage
// }

interface PushNotification {
  title: string;
  body: string;
  deepLink: string;  // Link to order tracking page
  data: {
    shipmentId: string;
    status: ShipmentStatus;
    timestamp: Date;
  };
}
```

### 11. Analytics & Reporting Dashboard

#### Key Performance Indicators (KPIs)
```typescript
interface AnalyticsMetrics {
  date: Date;
  period: "daily" | "weekly" | "monthly";
  
  // Delivery Performance
  totalOrders: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  onTimeDeliveryRate: number;  // %
  averageDeliveryTime: number;  // hours
  
  // Geographic Performance
  performanceByRegion: {
    regionName: string;
    successRate: number;
    averageTime: number;
    costPerDelivery: number;
  }[];
  
  // Carrier Performance
  performanceByCarrier: {
    carrierId: string;
    carrierName: string;
    successRate: number;
    averageTime: number;
    costPerDelivery: number;
    customerRating: number;
  }[];
  
  // Customer Satisfaction
  averageRating: number;
  nps: number;  // Net Promoter Score
  customerRetention: number;  // %
  
  // Financial
  totalRevenue: number;
  totalCost: number;
  profitMargin: number;  // %
  costPerDelivery: number;
  averageOrderValue: number;
  
  // Operational
  driverUtilization: number;  // %
  vehicleUtilization: number;  // %
  peakHours: string[];
  bottlenecks: string[];
}
```

#### Real-Time Dashboard
```typescript
// WebSocket streaming of:
// - Live delivery locations (map)
// - In-transit shipments count
// - Completion rate (animated gauge)
// - Average ETA vs actual
// - Regional heatmap (hot/cold zones)
// - Driver availability
// - Failed delivery alerts
```

### 12. Exception Handling System

#### Failed Delivery Management
```typescript
interface FailedDeliveryReason {
  code: string;
  description: string;
  retryable: boolean;
  immediateActions: string[];
}

const FAILURE_REASONS = {
  ADDRESS_NOT_FOUND: {
    retryable: true,
    immediateActions: ["contact_customer", "show_alternatives"]
  },
  CUSTOMER_NOT_AVAILABLE: {
    retryable: true,
    immediateActions: ["schedule_redelivery", "offer_pickup"]
  },
  REFUSED_DELIVERY: {
    retryable: false,
    immediateActions: ["initiate_return", "contact_admin"]
  },
  DAMAGED_GOODS: {
    retryable: false,
    immediateActions: ["capture_photo", "file_claim", "contact_customer"]
  },
  WEATHER_CONDITIONS: {
    retryable: true,
    immediateActions: ["reschedule", "notify_customer"]
  }
};

async function handleFailedDelivery(
  shipmentId: string,
  failureReason: string
): Promise<void> {
  // Log failure with photo evidence
  // Determine retry strategy
  // Auto-reschedule if retryable
  // Notify customer with options
  // Escalate to admin if needed
  // Update shipment status
}
```

#### Alternative Delivery Options
```typescript
interface DeliveryOptions {
  shipmentId: string;
  originalDeliveryDate: Date;
  failureReason: string;
  
  options: {
    rescheduleForNextDay: boolean;
    rescheduleForSpecificDate: Date[];
    pickupFromStation: PickupStation[];
    pickupFromWarehouse: Warehouse[];
    holdForCustomerPickup: boolean;
  };
  
  selectedOption?: string;
  selectedDate?: Date;
}

// Present options to customer via:
// - SMS with booking link
// - Email with detailed options
// - Push notification
// - WhatsApp callback option
```

#### Return & Damage Claims
```typescript
interface ReturnRequest {
  _id: ObjectId;
  shipmentId: string;
  orderId: string;
  customerId: string;
  
  reason: "refused" | "damaged" | "lost" | "incorrect" | "other";
  description: string;
  proofOfDamage?: {
    photos: string[];
    video?: string;
    inspectionReport?: string;
  };
  
  status: "submitted" | "investigating" | "approved" | "rejected" | "resolved";
  
  // Resolution
  refundAmount?: number;
  replacement?: boolean;
  creditStore?: boolean;
  
  createdAt: Date;
  resolvedAt?: Date;
}
```

#### Escalation Workflow
```typescript
interface EscalationRule {
  trigger: "failed_delivery" | "customer_complaint" | "quality_issue";
  threshold: {
    count: number;  // Times occurred
    timeframe: string;  // "7days", "30days"
  };
  
  escalationSteps: {
    level1: "reassign_driver" | "change_carrier";
    level2: "manager_review";
    level3: "executive_escalation";
    level4: "customer_refund";
  };
}
```
