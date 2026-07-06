// University of Ghana, Legon Approximate Boundaries (Longitude, Latitude)
const UG_POLYGON = [
  [-0.1980, 5.6600], // North West (Near Haatso-Atomic)
  [-0.1700, 5.6600], // North East
  [-0.1700, 5.6350], // South East (Near Okponglo)
  [-0.1980, 5.6350]  // South West (Near GIMPA)
];

// Ray-Casting Algorithm to check if a point is inside a polygon
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