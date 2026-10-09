const sameId = (left, right) => left != null && right != null && left.toString() === right.toString();

export const getRedispatchValidationError = (booking, user, now = Date.now()) => {
  if (!booking) {
    return { status: 404, code: 'BOOKING_NOT_FOUND', message: 'Booking not found' };
  }

  const isPassengerOwner = sameId(booking.passengerId, user?._id || user?.id);
  const isAdmin = user?.role === 'admin';
  if (!isPassengerOwner && !isAdmin) {
    return {
      status: 403,
      code: 'FORBIDDEN',
      message: 'Only the booking passenger or an administrator may retry dispatch'
    };
  }
  if (booking.status !== 'pending') {
    return {
      status: 409,
      code: 'BOOKING_NOT_PENDING',
      message: `Cannot dispatch a booking in state [${booking.status}]`
    };
  }
  if (booking.expiresAt && new Date(booking.expiresAt).getTime() <= now) {
    return { status: 409, code: 'BOOKING_EXPIRED', message: 'This booking dispatch window has expired' };
  }

  return null;
};
