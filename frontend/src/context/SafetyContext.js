// frontend/src/context/SafetyContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import { safetyService } from '../api/services/safetyService';
import { useAuth } from './AuthContext';
import { getPersistentSocket } from '../api/socketHelper';

const SafetyContext = createContext(null);

export const SafetyProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [isActivatingSOS, setIsActivatingSOS] = useState(false);
  const [emergencyOverlayVisible, setEmergencyOverlayVisible] = useState(false);
  
  // Subsystems State
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [safetyPreferences, setSafetyPreferences] = useState({
    autoShareAllRides: false,
    selectedTrustedContactIds: [],
  });
  const [safetyDisclosure, setSafetyDisclosure] = useState({
    version: null,
    acceptedAt: null,
  });

  // Idempotency tracking ref
  const currentIdempotencyKeyRef = useRef(null);

  // 1. Fetch Active Emergency (Reconciliation Authority)
  const refreshActiveEmergency = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await safetyService.getActiveEmergency();
      if (res.success && res.data?.event) {
        setActiveEmergency(res.data.event);
      } else {
        setActiveEmergency(null);
      }
    } catch (err) {
      console.warn('[SafetyContext] Failed to fetch active emergency:', err?.message);
    }
  }, [token, user]);

  // 2. Fetch Trusted Contacts
  const refreshContacts = useCallback(async () => {
    if (!token || !user) return;
    try {
      setContactsLoading(true);
      const res = await safetyService.getTrustedContacts();
      if (res.success && res.data?.contacts) {
        setTrustedContacts(res.data.contacts);
      }
    } catch (err) {
      console.warn('[SafetyContext] Failed to fetch trusted contacts:', err?.message);
    } finally {
      setContactsLoading(false);
    }
  }, [token, user]);

  // 3. Fetch Safety Preferences & Disclosure
  const refreshPreferences = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await safetyService.getSafetyPreferences();
      if (res.success && res.data) {
        if (res.data.safetyPreferences) setSafetyPreferences(res.data.safetyPreferences);
        if (res.data.safetyDisclosure) setSafetyDisclosure(res.data.safetyDisclosure);
      }
    } catch (err) {
      console.warn('[SafetyContext] Failed to fetch safety preferences:', err?.message);
    }
  }, [token, user]);

  // Initialize and load on login
  useEffect(() => {
    if (token && user) {
      refreshActiveEmergency();
      refreshContacts();
      refreshPreferences();
    } else {
      setActiveEmergency(null);
      setTrustedContacts([]);
      setEmergencyOverlayVisible(false);
    }
  }, [token, user, refreshActiveEmergency, refreshContacts, refreshPreferences]);

  // App State Lifecycle Reconciliation (Foreground restore)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && token && user) {
        refreshActiveEmergency();
      }
    });
    return () => subscription.remove();
  }, [token, user, refreshActiveEmergency]);

  // Realtime Socket Event Subscriptions
  useEffect(() => {
    if (!token || !user) return;
    let isMounted = true;

    const setupSocket = async () => {
      try {
        const socket = await getPersistentSocket();
        if (!socket || !isMounted) return;

        const eventId = activeEmergency?._id || activeEmergency?.id;
        if (eventId) {
          socket.emit('safety:join_event', { eventId });
        }

        const handleUpdate = (data) => {
          if (data?.event) {
            setActiveEmergency(data.event);
          } else {
            refreshActiveEmergency();
          }
        };

        socket.on('safety:emergency_update', handleUpdate);
        socket.on('safety:status_updated', handleUpdate);
        socket.on('safety:operator_acknowledged', handleUpdate);
        socket.on('safety:operator_ack', handleUpdate);
        socket.on('safety:escalation_updated', handleUpdate);
        socket.on('safety:timeline_appended', handleUpdate);
        socket.on('safety:event_resolved', handleUpdate);

        return () => {
          socket.off('safety:emergency_update', handleUpdate);
          socket.off('safety:status_updated', handleUpdate);
          socket.off('safety:operator_acknowledged', handleUpdate);
          socket.off('safety:operator_ack', handleUpdate);
          socket.off('safety:escalation_updated', handleUpdate);
          socket.off('safety:timeline_appended', handleUpdate);
          socket.off('safety:event_resolved', handleUpdate);
        };
      } catch (err) {
        console.warn('[SafetyContext] Socket setup warning:', err?.message);
      }
    };

    const cleanupPromise = setupSocket();
    return () => {
      isMounted = false;
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, [token, user, activeEmergency?._id, activeEmergency?.id, refreshActiveEmergency]);

  // 4. Trigger Emergency SOS
  const triggerSOS = useCallback(async ({ bookingId, tripId, category } = {}) => {
    try {
      setIsActivatingSOS(true);
      
      // Generate unique idempotency key if not already assigned
      if (!currentIdempotencyKeyRef.current) {
        currentIdempotencyKeyRef.current = `sos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }

      // Collect real GPS coordinate if location permission is granted
      let locationPayload = null;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc?.coords) {
            locationPayload = {
              coordinates: [loc.coords.longitude, loc.coords.latitude],
              accuracy: loc.coords.accuracy || null,
            };
          }
        }
      } catch (locErr) {
        // Safe swallow: location failure never blocks SOS creation
      }

      const res = await safetyService.triggerSOS({
        bookingId: bookingId || null,
        tripId: tripId || null,
        location: locationPayload,
        category: category || null,
        source: 'passenger_sos',
        idempotencyKey: currentIdempotencyKeyRef.current,
      });

      if (res.success && res.data?.event) {
        setActiveEmergency(res.data.event);
        setEmergencyOverlayVisible(true);
        currentIdempotencyKeyRef.current = null; // Reset for future distinct SOS invocations
        return { success: true, event: res.data.event };
      } else {
        throw new Error(res.error?.message || 'Failed to trigger emergency SOS');
      }
    } catch (error) {
      console.error('[SafetyContext] triggerSOS error:', error);
      throw error;
    } finally {
      setIsActivatingSOS(false);
    }
  }, []);

  // 5. Update Category Post-Trigger
  const updateCategory = useCallback(async (category) => {
    if (!activeEmergency) return;
    try {
      const eventId = activeEmergency._id || activeEmergency.id;
      const res = await safetyService.updateCategory(eventId, category);
      if (res.success && res.data?.event) {
        setActiveEmergency(res.data.event);
      }
    } catch (err) {
      console.error('[SafetyContext] updateCategory error:', err);
      throw err;
    }
  }, [activeEmergency]);

  // 6. Report Safe / False Alarm
  const reportSafe = useCallback(async ({ reason = 'user_reported_safe', notes = '' } = {}) => {
    if (!activeEmergency) return;
    try {
      const eventId = activeEmergency._id || activeEmergency.id;
      const res = await safetyService.reportSafe(eventId, { reason, notes });
      if (res.success && res.data?.event) {
        if (res.data.event.status === 'resolved') {
          setActiveEmergency(null);
          setEmergencyOverlayVisible(false);
        } else {
          setActiveEmergency(res.data.event);
        }
        return res.data.event;
      }
    } catch (err) {
      console.error('[SafetyContext] reportSafe error:', err);
      throw err;
    }
  }, [activeEmergency]);

  // Force-clear emergency locally if passenger confirmed safe
  const clearEmergency = useCallback(() => {
    setActiveEmergency(null);
    setEmergencyOverlayVisible(false);
  }, []);

  // 7. Trusted Contacts Operations
  const addContact = useCallback(async ({ name, phoneNumber, relationship }) => {
    const res = await safetyService.addTrustedContact({ name, phoneNumber, relationship });
    if (res.success) {
      await refreshContacts();
      return res.data?.contact;
    }
    throw new Error(res.error?.message || 'Failed to add contact');
  }, [refreshContacts]);

  const updateContact = useCallback(async (id, data) => {
    const res = await safetyService.updateTrustedContact(id, data);
    if (res.success) {
      await refreshContacts();
      return res.data?.contact;
    }
    throw new Error(res.error?.message || 'Failed to update contact');
  }, [refreshContacts]);

  const deleteContact = useCallback(async (id) => {
    const res = await safetyService.deleteTrustedContact(id);
    if (res.success) {
      await refreshContacts();
      return true;
    }
    throw new Error(res.error?.message || 'Failed to delete contact');
  }, [refreshContacts]);

  const requestVerification = useCallback(async (id) => {
    const res = await safetyService.requestContactVerification(id);
    await refreshContacts();
    return res;
  }, [refreshContacts]);

  // 8. Safety Preferences & Disclosure
  const updatePreferences = useCallback(async (data) => {
    const res = await safetyService.updateSafetyPreferences(data);
    if (res.success && res.data?.safetyPreferences) {
      setSafetyPreferences(res.data.safetyPreferences);
    }
    return res;
  }, []);

  const acceptDisclosure = useCallback(async (version = '1.0') => {
    const res = await safetyService.recordDisclosureAcceptance(version);
    if (res.success && res.data?.safetyDisclosure) {
      setSafetyDisclosure(res.data.safetyDisclosure);
    }
    return res;
  }, []);

  const isEmergencyActive = !!(
    activeEmergency && ['active', 'acknowledged', 'responding'].includes(activeEmergency.status)
  );

  const value = {
    activeEmergency,
    isEmergencyActive,
    isActivatingSOS,
    emergencyOverlayVisible,
    setEmergencyOverlayVisible,
    openEmergencyOverlay: () => setEmergencyOverlayVisible(true),
    dismissEmergencyOverlay: () => setEmergencyOverlayVisible(false),
    triggerSOS,
    updateCategory,
    reportSafe,
    clearEmergency,
    refreshActiveEmergency,
    trustedContacts,
    contactsLoading,
    refreshContacts,
    addContact,
    updateContact,
    deleteContact,
    requestVerification,
    safetyPreferences,
    updatePreferences,
    safetyDisclosure,
    acceptDisclosure,
  };

  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
};

export const useSafety = () => {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
};

export default SafetyContext;
