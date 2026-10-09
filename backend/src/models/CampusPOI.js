import mongoose from 'mongoose';

const campusPOISchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true 
    },
    aliases: [{ 
      type: String, 
      trim: true 
    }],
    category: {
      type: String,
      enum: [
        'hall',
        'hostel',
        'library',
        'faculty',
        'gate',
        'market',
        'administration',
        'sports',
        'other'
      ],
      required: true,
      default: 'other'
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: (coords) => (
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 && coords[0] <= 180 && // longitude
            coords[1] >= -90 && coords[1] <= 90     // latitude
          ),
          message: 'Coordinates must be valid GeoJSON [longitude, latitude] within global bounds'
        }
      }
    },
    boundaryPolygon: {
      type: {
        type: String,
        enum: ['Polygon']
      },
      coordinates: {
        type: [[[Number]]]
      }
    },
    campusZone: {
      type: String,
      required: true,
      trim: true,
      default: 'Central'
    },
    coordinateProvenance: {
      type: {
        type: String,
        enum: ['verified', 'imported', 'user_submitted', 'development_estimate'],
        default: 'development_estimate'
      },
      source: {
        type: String,
        default: 'University of Ghana Legon campus landmark development approximation'
      }
    },
    externalRef: {
      provider: { type: String, enum: ['openstreetmap'], required: false },
      osmType: { type: String, enum: ['node', 'way', 'relation'], required: false },
      osmId: { type: String, required: false },
      osmKey: { type: String, required: false }
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    moderationStatus: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved',
      index: true
    },
    moderationNote: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'campus_pois'
  }
);

campusPOISchema.index({ coordinates: '2dsphere' });
campusPOISchema.index({ name: 'text', aliases: 'text' });
campusPOISchema.index({ campusZone: 1, category: 1 });
campusPOISchema.index({ submittedBy: 1, moderationStatus: 1 });
campusPOISchema.index({ 'externalRef.osmKey': 1 }, { unique: true, sparse: true });

export default mongoose.model('CampusPOI', campusPOISchema);
