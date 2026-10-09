const coordinatesOf = (value) => value?.coordinates?.coordinates || value?.coordinates || null;

export const serializeTripStop = (stop, { includePassengerContact = false, viewerId = null } = {}) => {
  const passenger = stop.passengerId && typeof stop.passengerId === 'object' ? stop.passengerId : null;
  const isOwnStop = viewerId && (passenger?._id || stop.passengerId)?.toString() === viewerId.toString();
  return {
    stopId: stop.stopId,
    bookingId: stop.bookingId,
    passengerId: passenger?._id || stop.passengerId,
    passenger: includePassengerContact || isOwnStop ? {
      id: passenger?._id || stop.passengerId,
      fullName: passenger?.fullName || 'Campus Passenger',
      phoneNumber: includePassengerContact ? passenger?.phoneNumber || null : null,
      avatarUri: passenger?.avatarUri || null
    } : undefined,
    stopType: stop.stopType,
    name: stop.name,
    coordinates: coordinatesOf(stop.coordinates),
    sequenceOrder: stop.sequenceOrder,
    status: stop.status,
    arrivedAt: stop.arrivedAt,
    departedAt: stop.departedAt,
    estimatedDistanceMeters: stop.estimatedDistanceMeters,
    estimatedDurationSeconds: stop.estimatedDurationSeconds
  };
};

export const serializeTrip = (trip, { includePassengerContact = false, viewerId = null } = {}) => {
  const raw = trip.toObject ? trip.toObject() : trip;
  return {
    ...raw,
    tripStops: (trip.tripStops || []).map((stop) => serializeTripStop(stop, { includePassengerContact, viewerId }))
  };
};
