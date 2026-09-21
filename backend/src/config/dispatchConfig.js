/**
 * Canonical Configuration for Solo Dispatch, Driver Telemetry, and Geospatial Gates.
 * Phase 2.2 Canonical Domain & Architecture Specification v1.1.
 */

export const DISPATCH_CONFIG = {
  DISPATCH_OFFER_TTL_MS: parseInt(process.env.DISPATCH_OFFER_TTL_MS, 10) || 15000, // 15 seconds
  DRIVER_HEARTBEAT_FRESHNESS_MS: parseInt(process.env.DRIVER_HEARTBEAT_FRESHNESS_MS, 10) || 60000, // 60 seconds
  MAX_TELEMETRY_SPEED_KMH: parseFloat(process.env.MAX_TELEMETRY_SPEED_KMH) || 120.0, // 120 km/h
  PICKUP_ARRIVAL_RADIUS_METERS: parseFloat(process.env.PICKUP_ARRIVAL_RADIUS_METERS) || 75.0, // 75 meters
  DROPOFF_COMPLETION_RADIUS_METERS: parseFloat(process.env.DROPOFF_COMPLETION_RADIUS_METERS) || 100.0, // 100 meters
  CANDIDATE_SEARCH_RADIUS_METERS: parseFloat(process.env.CANDIDATE_SEARCH_RADIUS_METERS) || 5000.0, // 5000 meters (5 km)
  POOLING_SEARCH_RADIUS_METERS: parseFloat(process.env.POOLING_SEARCH_RADIUS_METERS) || 3000.0, // 3000 meters (3 km)
  TELEMETRY_PERSISTENCE_INTERVAL_MS: parseInt(process.env.TELEMETRY_PERSISTENCE_INTERVAL_MS, 10) || 5000, // 5 seconds
  
  // Phase 2.3 Shared Pooling & Detour Constants
  SHARED_FARE_DISCOUNT_PERCENT: parseFloat(process.env.SHARED_FARE_DISCOUNT_PERCENT) || 20.0, // 20% pooling discount
  MAX_ADDITIONAL_DISTANCE_METERS: parseFloat(process.env.MAX_ADDITIONAL_DISTANCE_METERS) || 1500.0, // 1.5 km
  MAX_ADDITIONAL_RIDE_TIME_SECONDS: parseFloat(process.env.MAX_ADDITIONAL_RIDE_TIME_SECONDS) || 600.0, // 10 minutes (600s)
  DEFAULT_SHARED_CAPACITY: parseInt(process.env.DEFAULT_SHARED_CAPACITY, 10) || 3,
  MIN_SHARED_CAPACITY: 2
};

export default DISPATCH_CONFIG;
