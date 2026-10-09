import express from 'express';
import { protect, requireApprovedDriver } from '../middleware/authMiddleware.js';
import { listPendingOffersForDriver, respondToDispatchOffer } from '../services/dispatchOfferService.js';

const router = express.Router();

router.get('/pending', protect, requireApprovedDriver, async (req, res, next) => {
  try {
    const offers = await listPendingOffersForDriver(req.user._id);
    res.json({ success: true, count: offers.length, data: offers });
  } catch (error) { next(error); }
});

router.post('/:offerId/respond', protect, requireApprovedDriver, async (req, res, next) => {
  try {
    const data = await respondToDispatchOffer({
      offerId: req.params.offerId,
      driverId: req.user._id,
      response: req.body?.response,
      io: req.app.get('io')
    });
    res.json({ success: true, data });
  } catch (error) {
    if (error.message === 'OFFER_NOT_FOUND') return res.status(404).json({ success: false, error: { code: 'OFFER_NOT_FOUND', message: 'Dispatch offer not found' } });
    if (error.message === 'OFFER_EXPIRED' || error.message.startsWith('OFFER_NOT_PENDING') || error.message === 'BOOKING_ALREADY_CLAIMED') {
      return res.status(409).json({ success: false, error: { code: error.message.split(':')[0], message: error.message } });
    }
    if (error.message === 'INVALID_OFFER_RESPONSE') return res.status(400).json({ success: false, error: { code: error.message, message: 'response must be accept or decline' } });
    next(error);
  }
});

export default router;
