/**
 * Haversine formula to compute geodesic distance in meters between two [longitude, latitude] points.
 */
export const calculateGeodesicDistanceMeters = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Pluggable Routing Engine Abstraction.
 * Supports self-hosted OSRM, Google Routes API, Mapbox, or local geodesic approximation.
 */
class RoutingService {
  constructor(provider = 'geodesic_fallback') {
    this.provider = provider;
    this.averageCampusSpeedMps = 6.94; // ~25 km/h campus driving speed
    this.roadTortuosityFactor = 1.3;  // Road network curve factor vs straight line
  }

  /**
   * Generates a driving route with structured distance, duration, and polyline across ordered waypoints.
   * @param {Array<[number, number]>} waypoints - Ordered array of [longitude, latitude] coordinates
   * @returns {Promise<{ polyline: string|null, distanceMeters: number, durationSeconds: number, calculatedAt: Date }>}
   */
  async getRoute(waypoints) {
    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      throw new Error('At least 2 coordinate waypoints are required to compute a route');
    }

    let totalDistanceMeters = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const legDist = calculateGeodesicDistanceMeters(waypoints[i], waypoints[i + 1]);
      totalDistanceMeters += Math.round(legDist * this.roadTortuosityFactor);
    }

    const durationSeconds = Math.max(60, Math.round(totalDistanceMeters / this.averageCampusSpeedMps));

    return {
      polyline: null,
      distanceMeters: totalDistanceMeters,
      durationSeconds,
      calculatedAt: new Date()
    };
  }

  /**
   * Computes structured distance and ETA between origin and destination coordinates
   */
  async calculateETA(originCoords, destinationCoords) {
    const route = await this.getRoute([originCoords, destinationCoords]);
    return {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      formattedETA: `${Math.ceil(route.durationSeconds / 60)} mins`,
      calculatedAt: route.calculatedAt
    };
  }

  /**
   * Computes a distance/duration matrix between multiple origins and destinations
   */
  async getDistanceMatrix(origins, destinations) {
    const matrix = [];
    for (let i = 0; i < origins.length; i++) {
      const row = [];
      for (let j = 0; j < destinations.length; j++) {
        const eta = await this.calculateETA(origins[i], destinations[j]);
        row.push(eta);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Evaluates dynamic stop insertion for shared pooling with strict causal ordering and detour constraints.
   * Pure, deterministic evaluator.
   * 
   * @param {Object} params
   * @param {Array} params.existingStops - Current tripStops array on DriverTrip
   * @param {Object} params.newPickup - New passenger pickup stop
   * @param {Object} params.newDropoff - New passenger dropoff stop
   * @param {Array<number>} params.driverCoords - Current [longitude, latitude] of driver
   * @param {Object} [params.constraints] - Detour and capacity constraints
   * @returns {Object} { valid: boolean, bestStops?: Array, detourMetrics?: Object, reason?: string }
   */
  evaluateRouteInsertion({
    existingStops = [],
    newPickup,
    newDropoff,
    driverCoords,
    constraints = {}
  }) {
    const maxAdditionalDistanceMeters = constraints.maxAdditionalDistanceMeters ?? 1500;
    const maxAdditionalRideTimeSeconds = constraints.maxAdditionalRideTimeSeconds ?? 600;

    if (!newPickup || !newDropoff) {
      return { valid: false, reason: 'MISSING_NEW_STOPS: Pickup and dropoff stops are required' };
    }

    const extractCoords = (stop) => {
      if (!stop) return null;
      if (Array.isArray(stop.coordinates)) return stop.coordinates;
      if (stop.coordinates?.coordinates && Array.isArray(stop.coordinates.coordinates)) {
        return stop.coordinates.coordinates;
      }
      return null;
    };

    const newPickupCoords = extractCoords(newPickup);
    const newDropoffCoords = extractCoords(newDropoff);

    if (!newPickupCoords || !newDropoffCoords) {
      return { valid: false, reason: 'INVALID_COORDINATES: Valid coordinates are required for new stops' };
    }

    // Direct route distance and duration for the new passenger
    const directDist = Math.round(calculateGeodesicDistanceMeters(newPickupCoords, newDropoffCoords) * this.roadTortuosityFactor);
    const directDur = Math.max(60, Math.round(directDist / this.averageCampusSpeedMps));

    // Separate immutable terminal stops from mutable active/pending stops
    const TERMINAL_STATUSES = ['completed', 'cancelled', 'skipped'];
    const immutablePrefix = [];
    const mutableSuffix = [];

    for (const stop of existingStops) {
      const stopObj = stop.toObject ? stop.toObject() : { ...stop };
      if (TERMINAL_STATUSES.includes(stopObj.status)) {
        immutablePrefix.push(stopObj);
      } else {
        mutableSuffix.push(stopObj);
      }
    }

    // Baseline route distance & duration starting from driverCoords through mutableSuffix
    const computeRouteMetrics = (origin, stops) => {
      let totalDist = 0;
      let curr = origin;
      for (const st of stops) {
        const coords = extractCoords(st);
        if (curr && coords) {
          totalDist += Math.round(calculateGeodesicDistanceMeters(curr, coords) * this.roadTortuosityFactor);
        }
        curr = coords;
      }
      const totalDur = Math.max(60, Math.round(totalDist / this.averageCampusSpeedMps));
      return { distanceMeters: totalDist, durationSeconds: totalDur };
    };

    const baselineOrigin = (driverCoords && Array.isArray(driverCoords) && driverCoords.length === 2) 
      ? driverCoords 
      : (mutableSuffix.length > 0 ? extractCoords(mutableSuffix[0]) : newPickupCoords);

    const baselineMetrics = computeRouteMetrics(baselineOrigin, mutableSuffix);

    // Compute direct in-vehicle metrics for each existing passenger in mutableSuffix
    // To measure additional detour accurately
    const getBookingInVehicleMetrics = (origin, stops, bookingIdStr) => {
      let pickupIndex = -1;
      let dropoffIndex = -1;
      for (let idx = 0; idx < stops.length; idx++) {
        if (stops[idx].bookingId?.toString() === bookingIdStr) {
          if (stops[idx].stopType === 'pickup') pickupIndex = idx;
          if (stops[idx].stopType === 'dropoff') dropoffIndex = idx;
        }
      }
      if (dropoffIndex === -1) return null; // Booking already dropped off or not in mutable list

      let inVehicleDist = 0;
      if (pickupIndex !== -1) {
        // Passenger picked up in this mutable segment
        for (let k = pickupIndex; k < dropoffIndex; k++) {
          const c1 = extractCoords(stops[k]);
          const c2 = extractCoords(stops[k + 1]);
          if (c1 && c2) {
            inVehicleDist += Math.round(calculateGeodesicDistanceMeters(c1, c2) * this.roadTortuosityFactor);
          }
        }
      } else {
        // Passenger is already onboard: path is from origin (driver position) through stops[0..dropoffIndex]
        let curr = origin;
        for (let k = 0; k <= dropoffIndex; k++) {
          const c = extractCoords(stops[k]);
          if (curr && c) {
            inVehicleDist += Math.round(calculateGeodesicDistanceMeters(curr, c) * this.roadTortuosityFactor);
          }
          curr = c;
        }
      }

      const inVehicleDur = Math.max(60, Math.round(inVehicleDist / this.averageCampusSpeedMps));
      return { distanceMeters: inVehicleDist, durationSeconds: inVehicleDur };
    };

    const existingBookingIds = [
      ...new Set(mutableSuffix.map(s => s.bookingId?.toString()).filter(Boolean))
    ];

    const existingBaselines = new Map();
    for (const bId of existingBookingIds) {
      existingBaselines.set(bId, getBookingInVehicleMetrics(baselineOrigin, mutableSuffix, bId));
    }

    const L = mutableSuffix.length;
    const candidates = [];

    const newPickupObj = newPickup.toObject ? newPickup.toObject() : { ...newPickup };
    const newDropoffObj = newDropoff.toObject ? newDropoff.toObject() : { ...newDropoff };

    // Test all valid insertion positions (i, j) where 0 <= i <= j <= L
    // If the first stop in mutableSuffix is already 'approaching' or 'arrived', we cannot insert before it
    const minPickupIndex = (mutableSuffix.length > 0 && ['approaching', 'arrived'].includes(mutableSuffix[0].status)) ? 1 : 0;

    for (let i = minPickupIndex; i <= L; i++) {
      for (let j = i; j <= L; j++) {
        // Construct candidate mutable sequence
        const candidateMutable = [...mutableSuffix];
        candidateMutable.splice(i, 0, newPickupObj);
        candidateMutable.splice(j + 1, 0, newDropoffObj);

        // 1. Verify Stop Ordering Causality for all bookings
        let causalityValid = true;
        const pickupPositions = new Map();
        const dropoffPositions = new Map();

        for (let idx = 0; idx < candidateMutable.length; idx++) {
          const stop = candidateMutable[idx];
          const bKey = stop.bookingId?.toString();
          if (!bKey) continue;
          if (stop.stopType === 'pickup') pickupPositions.set(bKey, idx);
          if (stop.stopType === 'dropoff') dropoffPositions.set(bKey, idx);
        }

        for (const [bKey, pIdx] of pickupPositions.entries()) {
          if (dropoffPositions.has(bKey)) {
            const dIdx = dropoffPositions.get(bKey);
            if (pIdx >= dIdx) {
              causalityValid = false;
              break;
            }
          }
        }

        if (!causalityValid) continue;

        // 2. Compute candidate overall route metrics
        const candidateMetrics = computeRouteMetrics(baselineOrigin, candidateMutable);
        const totalAdditionalDistance = Math.max(0, candidateMetrics.distanceMeters - baselineMetrics.distanceMeters);
        const totalAdditionalDuration = Math.max(0, candidateMetrics.durationSeconds - baselineMetrics.durationSeconds);

        const routeAddedDetourDist = Math.max(0, totalAdditionalDistance - directDist);
        const routeAddedDetourDur = Math.max(0, totalAdditionalDuration - directDur);

        if (routeAddedDetourDist > maxAdditionalDistanceMeters || routeAddedDetourDur > maxAdditionalRideTimeSeconds) {
          continue;
        }

        // 3. Verify Detour Constraints for Existing Passengers
        let detoursValid = true;
        let maxExistingDetourDist = 0;
        let maxExistingDetourDur = 0;

        for (const bId of existingBookingIds) {
          const base = existingBaselines.get(bId);
          if (!base) continue;
          const candidateInVehicle = getBookingInVehicleMetrics(baselineOrigin, candidateMutable, bId);
          if (!candidateInVehicle) continue;

          const addedDist = Math.max(0, candidateInVehicle.distanceMeters - base.distanceMeters);
          const addedDur = Math.max(0, candidateInVehicle.durationSeconds - base.durationSeconds);

          if (addedDist > maxAdditionalDistanceMeters || addedDur > maxAdditionalRideTimeSeconds) {
            detoursValid = false;
            break;
          }

          if (addedDist > maxExistingDetourDist) maxExistingDetourDist = addedDist;
          if (addedDur > maxExistingDetourDur) maxExistingDetourDur = addedDur;
        }

        if (!detoursValid) continue;

        // 4. Verify In-Vehicle Detour for the New Passenger
        const newPassengerInVehicle = getBookingInVehicleMetrics(baselineOrigin, candidateMutable, newPickupObj.bookingId?.toString());
        const newPassengerSharedDist = newPassengerInVehicle ? newPassengerInVehicle.distanceMeters : directDist;
        const newPassengerSharedDur = newPassengerInVehicle ? newPassengerInVehicle.durationSeconds : directDur;

        const newPassengerAddedDist = Math.max(0, newPassengerSharedDist - directDist);
        const newPassengerAddedDur = Math.max(0, newPassengerSharedDur - directDur);

        if (newPassengerAddedDist > maxAdditionalDistanceMeters || newPassengerAddedDur > maxAdditionalRideTimeSeconds) {
          continue;
        }

        candidates.push({
          i,
          j,
          candidateMutable,
          totalDistance: candidateMetrics.distanceMeters,
          totalDuration: candidateMetrics.durationSeconds,
          totalAdditionalDistance,
          totalAdditionalDuration,
          newPassengerDirectDistanceMeters: directDist,
          newPassengerDirectDurationSeconds: directDur,
          newPassengerSharedDistanceMeters: newPassengerSharedDist,
          newPassengerSharedDurationSeconds: newPassengerSharedDur
        });
      }
    }

    if (candidates.length === 0) {
      return {
        valid: false,
        reason: 'DETOUR_CONSTRAINTS_EXCEEDED: No insertion permutation satisfies max additional detour limits or causality'
      };
    }

    // Deterministic Optimization Objective:
    // 1. Minimize total additional distance
    // 2. Minimize total additional duration
    // 3. Earlier insertion index i, then j
    candidates.sort((a, b) => {
      if (a.totalAdditionalDistance !== b.totalAdditionalDistance) {
        return a.totalAdditionalDistance - b.totalAdditionalDistance;
      }
      if (a.totalAdditionalDuration !== b.totalAdditionalDuration) {
        return a.totalAdditionalDuration - b.totalAdditionalDuration;
      }
      if (a.i !== b.i) return a.i - b.i;
      return a.j - b.j;
    });

    const best = candidates[0];

    // Assemble final full trip stops with normalized sequenceOrder (1..N)
    const finalStops = [...immutablePrefix, ...best.candidateMutable].map((stop, idx) => ({
      ...stop,
      sequenceOrder: idx + 1
    }));

    return {
      valid: true,
      bestStops: finalStops,
      detourMetrics: {
        additionalDistanceMeters: best.totalAdditionalDistance,
        additionalDurationSeconds: best.totalAdditionalDuration,
        newPassengerDirectDistanceMeters: best.newPassengerDirectDistanceMeters,
        newPassengerDirectDurationSeconds: best.newPassengerDirectDurationSeconds,
        newPassengerSharedDistanceMeters: best.newPassengerSharedDistanceMeters,
        newPassengerSharedDurationSeconds: best.newPassengerSharedDurationSeconds
      }
    };
  }
}

export const evaluateRouteInsertion = (params) => {
  return new RoutingService().evaluateRouteInsertion(params);
};

export default new RoutingService();
