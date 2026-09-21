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
        enum: ['verified', 'imported', 'development_estimate'],
        default: 'development_estimate'
      },
      source: {
        type: String,
        default: 'University of Ghana Legon campus landmark development approximation'
      }
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

export default mongoose.model('CampusPOI', campusPOISchema);
