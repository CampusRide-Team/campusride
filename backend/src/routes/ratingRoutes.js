import express from 'express';
import { protect, requirePassenger } from '../middleware/authMiddleware.js';
import { submitRating } from '../services/ratingService.js';
import Rating from '../models/Rating.js';

const router = express.Router();

// POST /api/v1/ratings - Submit a rating for a completed booking
router.post('/', protect, requirePassenger, async (req, res, next) => {
  try {
    const rating = await submitRating(req.user._id, req.body);
    res.status(201).json({
      success: true,
      data: rating
    });
  } catch (error) {
    if (error.message.startsWith('RATING_ALREADY_EXISTS')) {
      return res.status(409).json({
        success: false,
        error: { code: 'RATING_ALREADY_EXISTS', message: error.message }
      });
    }
    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: error.message }
      });
    }
    next(error);
  }
});

// GET /api/v1/ratings/driver/:driverId - Get ratings summary for driver
router.get('/driver/:driverId', protect, async (req, res, next) => {
  try {
    const ratings = await Rating.find({ driverId: req.params.driverId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('passengerId', 'fullName avatarUri');

    res.json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (error) {
    next(error);
  }
});

export default router;
