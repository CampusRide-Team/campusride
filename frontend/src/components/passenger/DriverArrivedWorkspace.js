import React from 'react';
import DriverApproachWorkspace from './DriverApproachWorkspace';

export const DriverArrivedWorkspace = ({ driver, pickupLocationName, onPressCancelRide, style }) => (
  <DriverApproachWorkspace
    driver={driver}
    statusTitle="Your driver has arrived"
    statusSubtitle={pickupLocationName ? `Meet your driver at ${pickupLocationName}.` : 'Meet your driver at the pickup point.'}
    onPressCancelRide={onPressCancelRide}
    style={style}
  />
);

export default DriverArrivedWorkspace;
