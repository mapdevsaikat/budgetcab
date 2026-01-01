# Booking Status ENUM Documentation

## Overview

The `booking_status` ENUM type provides a standardized, type-safe way to track the complete lifecycle of a cab booking from creation to completion or cancellation.

## Database ENUM Type

```sql
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'driver_assigned',
  'driver_enroute',
  'arrived',
  'in_progress',
  'completed',
  'cancelled_by_user',
  'cancelled_by_driver',
  'cancelled_by_admin',
  'no_show',
  'expired'
);
```

## Booking Lifecycle

### Normal Flow (Happy Path)

```
pending
  ↓
confirmed
  ↓
driver_assigned
  ↓
driver_enroute
  ↓
arrived
  ↓
in_progress
  ↓
completed ✓
```

### Cancellation Paths

At any stage before `completed`, the booking can be cancelled:

```
Any Status
  ↓
cancelled_by_user    (User cancels)
cancelled_by_driver  (Driver cancels)
cancelled_by_admin   (Admin intervenes)
```

### Special Cases

```
pending → expired (Booking not confirmed in time)
arrived → no_show (User doesn't show up at pickup)
```

## Status Definitions

### Active States

| Status | Description | User Can See | Driver Can See | Admin Action |
|--------|-------------|--------------|----------------|--------------|
| **pending** | Initial state when booking is created | ✅ "Booking Pending" | ❌ | Can confirm or cancel |
| **confirmed** | Booking confirmed, awaiting driver assignment | ✅ "Finding Driver" | ❌ | Assign driver |
| **driver_assigned** | Driver has been assigned to the booking | ✅ "Driver Assigned" | ✅ "New Booking" | Monitor |
| **driver_enroute** | Driver is on the way to pickup location | ✅ "Driver on the Way" | ✅ "Heading to Pickup" | Track location |
| **arrived** | Driver has arrived at pickup location | ✅ "Driver Arrived" | ✅ "Waiting at Pickup" | Monitor for no-show |
| **in_progress** | Trip has started (passenger picked up) | ✅ "Trip in Progress" | ✅ "Trip Started" | Track trip |

### Terminal States

| Status | Description | Reason | Refund Eligible |
|--------|-------------|--------|-----------------|
| **completed** | Trip completed successfully | Normal completion | ❌ |
| **cancelled_by_user** | User cancelled the booking | User initiated | ✅ (Depends on timing) |
| **cancelled_by_driver** | Driver cancelled the booking | Driver unavailable/emergency | ✅ Full refund |
| **cancelled_by_admin** | Admin cancelled the booking | Policy violation/error | ✅ Full refund |
| **no_show** | User didn't show up at pickup | User absent after driver arrived | ❌ |
| **expired** | Booking expired (not confirmed in time) | System timeout | ✅ Full refund |

## Additional Columns Added

### 1. `driver_id` (uuid, nullable)
- Foreign key to `drivers` table
- Set when status changes to `driver_assigned`
- Used for driver assignment and tracking

### 2. `cancellation_reason` (text, nullable)
- Stores the reason for cancellation
- Required when status is any cancelled state
- Used for analytics and user feedback

### 3. `actual_pickup_time` (timestamptz, nullable)
- Actual timestamp when passenger was picked up
- Set when status changes to `in_progress`
- Used for calculating actual trip duration

### 4. `actual_drop_time` (timestamptz, nullable)
- Actual timestamp when passenger was dropped off
- Set when status changes to `completed`
- Used for trip completion and billing

## Usage in Code

### TypeScript Import

```typescript
import { 
  BookingStatus, 
  BookingStatusType,
  isActiveBooking,
  isCancelledBooking,
  getAllowedStatusTransitions,
  BookingStatusLabels,
  BookingStatusColors
} from '@/types/booking';
```

### Example: Check if Booking is Active

```typescript
const booking = await supabase
  .from('bookings')
  .select('*')
  .eq('id', bookingId)
  .single();

if (isActiveBooking(booking.data.status)) {
  console.log('Booking is still active');
}
```

### Example: Update Booking Status

```typescript
const { error } = await supabase
  .from('bookings')
  .update({ 
    status: BookingStatus.DRIVER_ASSIGNED,
    driver_id: driverId,
    updated_at: new Date().toISOString()
  })
  .eq('id', bookingId);
```

### Example: Display Status with Colors

```tsx
const StatusBadge = ({ status }: { status: BookingStatusType }) => {
  const colors = BookingStatusColors[status];
  const label = BookingStatusLabels[status];
  
  return (
    <span className={`px-3 py-1 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
      {label}
    </span>
  );
};
```

### Example: Validate Status Transition

```typescript
const canTransition = (currentStatus: BookingStatusType, newStatus: BookingStatusType): boolean => {
  const allowedTransitions = getAllowedStatusTransitions(currentStatus);
  return allowedTransitions.includes(newStatus);
};

// Usage
if (canTransition('confirmed', 'driver_assigned')) {
  // Proceed with status update
}
```

## Queries

### Get All Active Bookings

```sql
SELECT * FROM bookings 
WHERE status IN ('pending', 'confirmed', 'driver_assigned', 'driver_enroute', 'arrived', 'in_progress')
ORDER BY scheduled_time ASC;
```

### Get Completed Bookings for a User

```sql
SELECT * FROM bookings 
WHERE user_id = $1 
AND status = 'completed'
ORDER BY actual_drop_time DESC;
```

### Get Driver's Active Booking

```sql
SELECT * FROM bookings 
WHERE driver_id = $1 
AND status IN ('driver_assigned', 'driver_enroute', 'arrived', 'in_progress')
LIMIT 1;
```

### Get Cancelled Bookings with Reasons

```sql
SELECT 
  booking_ref,
  status,
  cancellation_reason,
  created_at,
  updated_at
FROM bookings 
WHERE status IN ('cancelled_by_user', 'cancelled_by_driver', 'cancelled_by_admin')
ORDER BY updated_at DESC;
```

## Indexes Created

For optimal query performance, the following indexes were created:

```sql
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
```

## Best Practices

### For User App

1. **Show Active Bookings**: Filter by `isActiveBooking(status)`
2. **Enable Cancellation**: Only allow when status is in `['pending', 'confirmed', 'driver_assigned', 'driver_enroute']`
3. **Show ETA**: When status is `driver_enroute` or `arrived`
4. **Track Trip**: When status is `in_progress`

### For Driver App

1. **New Bookings**: Show bookings with status `driver_assigned`
2. **Accept/Reject**: Update to `driver_enroute` or `cancelled_by_driver`
3. **Arrived Button**: Update to `arrived` when at pickup
4. **Start Trip**: Update to `in_progress` when passenger boards
5. **Complete Trip**: Update to `completed` when passenger is dropped off

### For Admin Panel

1. **Monitor Dashboard**: Group bookings by status categories
2. **Intervention**: Can set to `cancelled_by_admin` with reason
3. **Analytics**: Track completion rates, cancellation reasons
4. **Driver Assignment**: Assign drivers when status is `confirmed`

## Migration Details

**Migration Name**: `create_booking_status_enum_fixed`

**Changes Made**:
1. Created `booking_status` ENUM type
2. Added `driver_id`, `cancellation_reason`, `actual_pickup_time`, `actual_drop_time` columns
3. Converted existing `status` column from TEXT with CHECK constraint to ENUM
4. Migrated existing 'cancelled' values to 'cancelled_by_user'
5. Created indexes for performance
6. Added documentation comments to database

## Testing Recommendations

1. **Test State Transitions**: Ensure only valid transitions are allowed
2. **Test UI Updates**: Verify status changes trigger appropriate UI updates
3. **Test Driver Assignment**: Confirm `driver_id` is set correctly
4. **Test Cancellations**: Verify `cancellation_reason` is captured
5. **Test Time Tracking**: Ensure `actual_pickup_time` and `actual_drop_time` are recorded

## Future Enhancements

Consider adding:
- `driver_accepted_time` timestamp
- `driver_rejected_time` timestamp  
- `estimated_arrival_time` timestamp
- `trip_rating` for user feedback
- `driver_notes` for trip details
- Status change history table for audit trail

