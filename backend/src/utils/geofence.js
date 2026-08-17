// Expanded Accra / University of Ghana Region Boundaries for Development & Testing
const UG_POLYGON = [
  [-0.2500, 5.7000], // North West (Expanded)
  [-0.1500, 5.7000], // North East (Expanded)
  [-0.1500, 5.5500], // South East (Expanded)
  [-0.2500, 5.5500]  // South West (Expanded)
];

// Ray-Casting Algorithm to check if a point is inside the polygon boundary
export const isInsideUG = (longitude, latitude) => {
  let isInside = false;
  for (let i = 0, j = UG_POLYGON.length - 1; i < UG_POLYGON.length; j = i++) {
    const xi = UG_POLYGON[i][0], yi = UG_POLYGON[i][1];
    const xj = UG_POLYGON[j][0], yj = UG_POLYGON[j][1];

    const intersect = ((yi > latitude) !== (yj > latitude)) &&
        (longitude < (xj - xi) * (latitude - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
};