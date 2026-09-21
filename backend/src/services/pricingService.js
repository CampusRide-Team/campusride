/**
 * Pluggable Fare & Pricing Engine Abstraction for CampusRide.
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * Final CampusRide business policies (base rates, km rates, time rates, shared discount percentages,
 * platform commission, surge formulas, and cancellation penalties) have NOT been permanently decided.
 * 
 * The default constants below are DEVELOPMENT CONFIGURATION FALLBACKS only, enabling end-to-end
 * local development and testing without prematurely fixing production product pricing policy.
 */

export const DEV_DEFAULT_PRICING_CONFIG = {
  baseFare: 8.0,            // Development fallback base rate (GHS)
  perKmRate: 3.5,           // Development fallback per-kilometer rate (GHS/km)
  perMinuteRate: 0.0,       // Development fallback per-minute rate
  surgeMultiplier: 1.0,     // Default surge baseline
  currency: 'GHS'
};

class PricingService {
  constructor(config = DEV_DEFAULT_PRICING_CONFIG) {
    this.config = { ...DEV_DEFAULT_PRICING_CONFIG, ...config };
  }

  /**
   * Updates runtime pricing configuration (e.g. from system settings or dynamic policy)
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Calculates a structured fare breakdown for a booking request.
   * 
   * @param {Object} params
   * @param {number} params.distanceMeters - Distance in meters computed by routing service
   * @param {number} [params.durationSeconds] - Estimated duration in seconds
   * @param {string} [params.rideMode='solo'] - 'solo' or 'shared'
   * @param {string} [params.pricingModel='platform_calculated'] - 'platform_calculated', 'driver_proposed', 'negotiated'
   * @param {number} [params.customBaseFare] - Optional override
   * @param {number} [params.customPerKmRate] - Optional override
   * @param {number} [params.discountAmount=0] - Explicit discount amount if configured by promo/policy
   * @returns {Object} Structured fare breakdown matching canonical schema
   */
  calculateEstimatedFare({
    distanceMeters = 0,
    durationSeconds = 0,
    rideMode = 'solo',
    pricingModel = 'platform_calculated',
    customBaseFare = null,
    customPerKmRate = null,
    discountAmount = 0
  } = {}) {
    const base = customBaseFare !== null ? Number(customBaseFare) : this.config.baseFare;
    const kmRate = customPerKmRate !== null ? Number(customPerKmRate) : this.config.perKmRate;
    const distanceKm = Math.max(0, Number(distanceMeters) / 1000);
    const distanceFare = Math.round(distanceKm * kmRate * 100) / 100;
    
    const minutes = Math.max(0, Number(durationSeconds) / 60);
    const timeFare = Math.round(minutes * this.config.perMinuteRate * 100) / 100;

    const subtotal = base + distanceFare + timeFare;
    const surged = Math.round(subtotal * this.config.surgeMultiplier * 100) / 100;
    
    // Explicit discount application (if supplied by promo/policy, not arbitrary hardcoded %):
    const totalFare = Math.max(0, Math.round((surged - discountAmount) * 100) / 100);

    return {
      baseFare: base,
      distanceFare,
      timeFare,
      surgeMultiplier: this.config.surgeMultiplier,
      discountAmount,
      totalFare,
      currency: this.config.currency,
      pricingModel,
      paymentStatus: 'unpaid',
      adjustments: []
    };
  }

  /**
   * Computes shared ride discounted fare from a base solo fare estimate.
   * @param {Object} soloFare - Fare breakdown for solo ride
   * @param {number} [discountPercent=20] - Percentage discount
   * @returns {Object} Structured fare breakdown with discount applied
   */
  calculateSharedFare(soloFare, discountPercent = 20) {
    const discountAmount = Math.round(soloFare.totalFare * (discountPercent / 100) * 100) / 100;
    const totalFare = Math.max(0, Math.round((soloFare.totalFare - discountAmount) * 100) / 100);

    return {
      ...soloFare,
      discountAmount,
      totalFare
    };
  }
}

export default new PricingService();
