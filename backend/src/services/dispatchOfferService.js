import DispatchOffer from '../models/DispatchOffer.js';
import RideBooking from '../models/RideBooking.js';
import DriverTrip from '../models/DriverTrip.js';
import { acceptSharedOffer, acceptSoloOffer } from './dispatchService.js';

export const serializeDispatchOffer = (offer) => ({
  id: offer._id,
  offerId: offer._id,
  bookingId: offer.bookingId?._id || offer.bookingId,
  tripId: offer.tripId?._id || offer.tripId || null,
  rideMode: offer.rideMode,
  offerType: offer.offerType,
  pickup: offer.pickup,
  dropoff: offer.dropoff,
  routeMetrics: offer.routeMetrics || null,
  detourMetrics: offer.detourMetrics || null,
  status: offer.status,
  expiresAt: offer.expiresAt,
  passenger: offer.bookingId?.passengerId || null
});

export const expireDispatchOffers = async (now = new Date()) => DispatchOffer.updateMany(
  { status: 'pending', expiresAt: { $lte: now } },
  { $set: { status: 'expired', respondedAt: now } }
);

export const listPendingOffersForDriver = async (driverId, now = new Date()) => {
  await expireDispatchOffers(now);
  const offers = await DispatchOffer.find({ driverId, status: 'pending', expiresAt: { $gt: now } })
    .sort({ createdAt: -1 })
    .populate({ path: 'bookingId', select: 'status passengerId', populate: { path: 'passengerId', select: 'fullName avatarUri' } });
  return offers.filter((offer) => offer.bookingId?.status === 'pending').map(serializeDispatchOffer);
};

export const respondToDispatchOffer = async ({ offerId, driverId, response, io = null }) => {
  if (!['accept', 'decline'].includes(response)) throw new Error('INVALID_OFFER_RESPONSE');
  const now = new Date();
  const offer = await DispatchOffer.findOne({ _id: offerId, driverId });
  if (!offer) throw new Error('OFFER_NOT_FOUND');
  if (offer.status !== 'pending') {
    if (offer.status === 'accepted' && response === 'accept') {
      const booking = await RideBooking.findById(offer.bookingId);
      return { offer: serializeDispatchOffer(offer), booking, idempotent: true };
    }
    throw new Error(`OFFER_NOT_PENDING:${offer.status}`);
  }
  if (offer.expiresAt <= now) {
    offer.status = 'expired';
    offer.respondedAt = now;
    await offer.save();
    throw new Error('OFFER_EXPIRED');
  }
  if (response === 'decline') {
    offer.status = 'declined';
    offer.respondedAt = now;
    await offer.save();
    return { offer: serializeDispatchOffer(offer) };
  }

  const booking = await RideBooking.findById(offer.bookingId);
  if (!booking) throw new Error('BOOKING_ALREADY_CLAIMED');
  if (booking.status !== 'pending') {
    if (booking.driverId?.toString() === driverId.toString() && booking.driverTripId) {
      offer.status = 'accepted';
      offer.respondedAt = offer.respondedAt || now;
      await offer.save();
      const trip = await DriverTrip.findById(booking.driverTripId);
      return { offer: serializeDispatchOffer(offer), booking, trip, idempotent: true };
    }
    throw new Error('BOOKING_ALREADY_CLAIMED');
  }
  const result = offer.rideMode === 'shared'
    ? await acceptSharedOffer(driverId, offer.bookingId, { tripId: offer.tripId, io })
    : await acceptSoloOffer(driverId, offer.bookingId, io);

  offer.status = 'accepted';
  offer.respondedAt = now;
  await offer.save();
  await DispatchOffer.updateMany(
    { bookingId: offer.bookingId, _id: { $ne: offer._id }, status: 'pending' },
    { $set: { status: 'superseded', respondedAt: now } }
  );
  return { ...result, offer: serializeDispatchOffer(offer) };
};
