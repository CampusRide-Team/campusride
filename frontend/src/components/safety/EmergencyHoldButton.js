// frontend/src/components/safety/EmergencyHoldButton.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { colors, radii, spacing, fonts } from '../../theme';
import { CRIcon } from '../common';

const HOLD_DURATION_MS = 2500; // 2.5s deliberate physical press
const GRACE_PERIOD_SEC = 3;    // 3s cancellation window

export const EmergencyHoldButton = ({ onTriggerSOS, isActivating = false, disabled = false, compact = false }) => {
  // 'idle' | 'holding' | 'countdown' | 'sending'
  const [buttonState, setButtonState] = useState('idle');
  const [countdownSeconds, setCountdownSeconds] = useState(GRACE_PERIOD_SEC);

  const holdProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const holdTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Trigger light haptic / vibration safely
  const triggerHaptic = (type = 'light') => {
    try {
      if (Platform.OS !== 'web') {
        if (type === 'heavy' || type === 'notification') {
          Vibration.vibrate([0, 100, 50, 100]);
        } else if (type === 'medium') {
          Vibration.vibrate(60);
        } else {
          Vibration.vibrate(30);
        }
      }
    } catch (e) {
      // Vibration unavailable
    }
  };

  // Reset to idle
  const resetToIdle = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    Animated.timing(holdProgress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    setButtonState('idle');
    setCountdownSeconds(GRACE_PERIOD_SEC);
  }, [holdProgress]);

  // Press In (Hold starts)
  const handlePressIn = () => {
    if (disabled || isActivating || buttonState !== 'idle') return;
    setButtonState('holding');
    triggerHaptic('medium');

    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    }).start();

    holdTimerRef.current = setTimeout(() => {
      // 2.5s hold complete -> Enter 3s cancellation grace window
      triggerHaptic('heavy');
      setButtonState('countdown');
      setCountdownSeconds(GRACE_PERIOD_SEC);

      let remaining = GRACE_PERIOD_SEC;
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        triggerHaptic('light');
        setCountdownSeconds(remaining);

        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current);
          setButtonState('sending');
          triggerHaptic('notification');
          if (onTriggerSOS) {
            onTriggerSOS();
          }
        }
      }, 1000);
    }, HOLD_DURATION_MS);
  };

  // Press Out (Early release cancels hold if not yet in countdown)
  const handlePressOut = () => {
    if (buttonState === 'holding') {
      resetToIdle();
    }
  };

  // User explicitly cancels during 3s grace countdown
  const handleCancelCountdown = () => {
    triggerHaptic('medium');
    resetToIdle();
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const widthInterpolation = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {buttonState === 'countdown' ? (
        <View style={[styles.countdownContainer, compact && styles.countdownContainerCompact]}>
          <View style={styles.countdownHeader}>
            <View style={styles.warningDot} />
            <Text style={[styles.countdownTitle, compact && styles.countdownTitleCompact]}>
              {compact ? `Sending in ${countdownSeconds}s` : `Emergency Request Sending in ${countdownSeconds}s`}
            </Text>
          </View>
          {!compact && <Text style={styles.countdownSub}>Release to continue, or tap Cancel to abort request.</Text>}
          <TouchableOpacity
            style={styles.cancelCountdownButton}
            onPress={handleCancelCountdown}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelCountdownText}>{compact ? 'Cancel' : 'Cancel Emergency'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isActivating || buttonState === 'sending'}
        >
          <View style={[styles.holdButton, compact && styles.holdButtonCompact, buttonState === 'holding' && styles.holdButtonActive]}>
            {/* Animated progress bar fill */}
            <Animated.View style={[styles.progressFill, { width: widthInterpolation }]} />

            <View style={[styles.buttonContent, compact && styles.buttonContentCompact]}>
              <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
                <CRIcon name="alert-circle" size={compact ? 20 : 22} color="#FFFFFF" />
              </View>
              <View style={[styles.textWrap, compact && styles.textWrapCompact]}>
                <Text style={[styles.buttonTitle, compact && styles.buttonTitleCompact]}>
                  {buttonState === 'holding'
                    ? compact ? 'Keep holding' : 'Keep Holding...'
                    : buttonState === 'sending' || isActivating
                    ? compact ? 'Sending…' : 'Sending SOS Request...'
                    : compact ? 'Emergency' : 'Press & Hold for SOS'}
                </Text>
                {!compact && <Text style={styles.buttonSub}>
                  {buttonState === 'holding'
                    ? 'Hold 2.5s to initiate request'
                    : 'Authoritative emergency alert to Campus Security'}
                </Text>}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  holdButton: {
    height: 64,
    backgroundColor: '#F0604F',
    borderRadius: radii.lg || 16,
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: '#F0604F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  holdButtonActive: {
    backgroundColor: '#D94F42',
    transform: [{ scale: 0.99 }],
  },
  holdButtonCompact: {
    height: 70,
    borderRadius: radii.md,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 1,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#C94539',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    gap: spacing.sm + 4,
    zIndex: 2,
  },
  buttonContentCompact: {
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  textWrap: {
    flex: 1,
  },
  textWrapCompact: {
    flex: 0,
    alignItems: 'center',
  },
  buttonTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  buttonTitleCompact: {
    fontSize: 12,
    textAlign: 'center',
  },
  buttonSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  countdownContainer: {
    backgroundColor: '#F3E0DD',
    borderWidth: 1.5,
    borderColor: '#B23A2F',
    borderRadius: radii.lg || 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  countdownContainerCompact: {
    height: 70,
    borderRadius: radii.md,
    padding: spacing.xs,
    justifyContent: 'center',
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: 4,
  },
  warningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B23A2F',
  },
  countdownTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#B23A2F',
  },
  countdownTitleCompact: {
    fontSize: 11,
  },
  countdownSub: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cancelCountdownButton: {
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: '#B23A2F',
    borderRadius: radii.md || 10,
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.lg,
  },
  cancelCountdownText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#B23A2F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default EmergencyHoldButton;
