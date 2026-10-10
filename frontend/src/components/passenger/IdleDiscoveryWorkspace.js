import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { radii, spacing, fonts } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { CRIcon } from '../common';

const PANEL_HEIGHTS = {
  COLLAPSED: 70,
  COMPACT: 214,
  EXPANDED: 404,
};

export const IdleDiscoveryWorkspace = ({
  pickupLocationName,
  isLocating = false,
  locationError,
  onPressPickup,
  popularPois = [],
  onPressSearch,
  onSelectPopularPoi,
  onPressAddLocation,
  style,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;

  const [panelState, setPanelState] = useState('COMPACT'); // 'COLLAPSED' | 'COMPACT' | 'EXPANDED'
  const animatedHeight = useRef(new Animated.Value(PANEL_HEIGHTS.COMPACT)).current;
  const currentHeightRef = useRef(PANEL_HEIGHTS.COMPACT);

  const animateToHeight = (targetHeight, nextState) => {
    Animated.spring(animatedHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start(() => {
      currentHeightRef.current = targetHeight;
      if (nextState) setPanelState(nextState);
    });
  };

  const handleToggleState = () => {
    if (panelState === 'COLLAPSED') {
      animateToHeight(PANEL_HEIGHTS.COMPACT, 'COMPACT');
    } else if (panelState === 'COMPACT') {
      animateToHeight(PANEL_HEIGHTS.EXPANDED, 'EXPANDED');
    } else {
      animateToHeight(PANEL_HEIGHTS.COMPACT, 'COMPACT');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = currentHeightRef.current - gestureState.dy;
        if (newHeight >= PANEL_HEIGHTS.COLLAPSED - 10 && newHeight <= PANEL_HEIGHTS.EXPANDED + 20) {
          animatedHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const releasedHeight = currentHeightRef.current - gestureState.dy;
        if (gestureState.dy < -30 || (gestureState.vy < -0.4 && releasedHeight > PANEL_HEIGHTS.COMPACT)) {
          // Swipe up fast or past compact -> Expand
          animateToHeight(PANEL_HEIGHTS.EXPANDED, 'EXPANDED');
        } else if (gestureState.dy > 30 || (gestureState.vy > 0.4 && releasedHeight < PANEL_HEIGHTS.COMPACT)) {
          // Swipe down fast or below compact -> Collapse
          animateToHeight(PANEL_HEIGHTS.COLLAPSED, 'COLLAPSED');
        } else {
          // Snap to nearest milestone
          const distToCollapsed = Math.abs(releasedHeight - PANEL_HEIGHTS.COLLAPSED);
          const distToCompact = Math.abs(releasedHeight - PANEL_HEIGHTS.COMPACT);
          const distToExpanded = Math.abs(releasedHeight - PANEL_HEIGHTS.EXPANDED);
          const minDist = Math.min(distToCollapsed, distToCompact, distToExpanded);

          if (minDist === distToCollapsed) {
            animateToHeight(PANEL_HEIGHTS.COLLAPSED, 'COLLAPSED');
          } else if (minDist === distToCompact) {
            animateToHeight(PANEL_HEIGHTS.COMPACT, 'COMPACT');
          } else {
            animateToHeight(PANEL_HEIGHTS.EXPANDED, 'EXPANDED');
          }
        }
      },
    })
  ).current;

  const getPoiIcon = (category = '') => {
    const normalized = String(category).toLowerCase();
    if (normalized.includes('library')) return 'book-outline';
    if (normalized.includes('faculty') || normalized.includes('engineering') || normalized.includes('school')) return 'school-outline';
    if (normalized.includes('market')) return 'cart-outline';
    if (normalized.includes('home')) return 'home-outline';
    return 'business-outline';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: animatedHeight,
          backgroundColor: colors.surface.base,
          borderTopColor: colors.border.subtle,
        },
        style,
      ]}
    >
      {/* 1. Drag / Sheet Grab Area */}
      <View style={styles.dragHandleArea} {...panResponder.panHandlers}>
        <TouchableOpacity
          onPress={handleToggleState}
          activeOpacity={0.7}
          style={styles.handleHitbox}
          accessibilityRole="button"
          accessibilityLabel="Toggle map bottom panel"
        >
          <View style={[styles.grabBar, { backgroundColor: colors.border.subtle }]} />
        </TouchableOpacity>
      </View>

      {/* 2. Collapsed Minimal Search Strip */}
      {panelState === 'COLLAPSED' ? (
        <TouchableOpacity
          style={[styles.collapsedSearchStrip, { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle }]}
          onPress={onPressSearch}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Where to? Search destination"
        >
          <CRIcon name="search" size={20} color={colors.text.primary} style={styles.collapsedIcon} />
          <Text style={[styles.collapsedSearchText, { color: colors.text.primary }]}>Where to?</Text>
          <View style={{ flex: 1 }} />
          <CRIcon name="arrow-forward" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      ) : (
        /* 3. Compact & Expanded Content */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Prominent Bolt/Yango Style "Where to?" Destination Input Bar */}
          <TouchableOpacity
            style={[
              styles.searchTriggerBar,
              {
                backgroundColor: colors.surface.tile || '#F3F3F1',
                borderColor: colors.border.subtle,
              },
            ]}
            onPress={onPressSearch}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Where to? Search destination"
          >
            <View style={[styles.searchIconWrap, { backgroundColor: colors.surface.base }]}>
              <CRIcon name="search" size={18} color={colors.brand.primary} />
            </View>
            <View style={styles.searchTitles}>
              <Text style={[styles.searchTitle, { color: colors.text.primary }]}>Where to?</Text>
              <Text style={[styles.searchSubtitle, { color: colors.text.secondary }]}>Search campus destinations…</Text>
            </View>
          </TouchableOpacity>

          {/* Quick destinations */}
          <View style={styles.quickChipsRow}>
            <TouchableOpacity
              style={[styles.quickChip, { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle }]}
              onPress={onPressSearch}
              activeOpacity={0.75}
            >
              <View style={[styles.chipIconWrap, { backgroundColor: colors.surface.base }]}>
                <CRIcon name="home-outline" size={20} color={colors.brand.primary} />
              </View>
              <View style={styles.chipCopy}>
                <Text style={[styles.chipTitle, { color: colors.text.primary }]}>Home</Text>
                <Text style={[styles.chipSub, { color: colors.text.secondary }]}>Set address</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickChip, { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle }]}
              onPress={() => {
                if (popularPois[0]) onSelectPopularPoi?.(popularPois[0]);
                else onPressSearch?.();
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.chipIconWrap, { backgroundColor: colors.surface.base }]}>
                <CRIcon name={getPoiIcon(popularPois[0]?.category || 'faculty')} size={20} color={colors.brand.primary} />
              </View>
              <View style={styles.chipCopy}>
                <Text style={[styles.chipTitle, { color: colors.text.primary }]} numberOfLines={1}>
                  {popularPois[0]?.name ? popularPois[0].name.split(' ')[0] : 'Faculty'}
                </Text>
                <Text style={[styles.chipSub, { color: colors.text.secondary }]} numberOfLines={1}>
                  {popularPois[0]?.name ? (popularPois[0].name.split(' ').slice(1).join(' ') || 'Campus') : 'Find building'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickChip, { backgroundColor: colors.surface.tile || '#F3F3F1', borderColor: colors.border.subtle }]}
              onPress={() => {
                if (popularPois[1]) onSelectPopularPoi?.(popularPois[1]);
                else onPressSearch?.();
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.chipIconWrap, { backgroundColor: colors.surface.base }]}>
                <CRIcon name={getPoiIcon(popularPois[1]?.category || 'market')} size={20} color={colors.brand.primary} />
              </View>
              <View style={styles.chipCopy}>
                <Text style={[styles.chipTitle, { color: colors.text.primary }]} numberOfLines={1}>
                  {popularPois[1]?.name ? popularPois[1].name.split(' ')[0] : 'Market'}
                </Text>
                <Text style={[styles.chipSub, { color: colors.text.secondary }]} numberOfLines={1}>
                  {popularPois[1]?.name ? (popularPois[1].name.split(' ').slice(1).join(' ') || 'Campus') : 'Find stall'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addPlaceCard, { backgroundColor: colors.brand.primaryTint, borderColor: colors.border.subtle }]}
            onPress={onPressAddLocation}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Add a new place to the campus map"
          >
            <View style={[styles.addPlaceIconWrap, { backgroundColor: colors.surface.base }]}>
              <CRIcon name="add-circle-outline" size={29} color={colors.brand.primary} />
            </View>
            <View style={styles.addPlaceCopy}>
              <Text style={[styles.addPlaceTitle, { color: colors.text.primary }]}>Add a new place on campus</Text>
              <Text style={[styles.addPlaceSubtitle, { color: colors.text.secondary }]}>Can’t find a lecture hall, lab, hostel or exam centre? Add it to the map.</Text>
            </View>
            <CRIcon name="chevron-forward" size={22} color={colors.brand.primary} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  dragHandleArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  handleHitbox: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  collapsedSearchStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginTop: 2,
  },
  collapsedIcon: {
    marginRight: spacing.sm,
  },
  collapsedSearchText: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  searchTriggerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  searchTitles: {
    flex: 1,
  },
  searchTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  searchSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    marginTop: 1,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  quickChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 82,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
  },
  chipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCopy: {
    width: '100%',
    alignItems: 'center',
  },
  chipTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    textAlign: 'center',
  },
  chipSub: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 1,
  },
  addPlaceCard: {
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addPlaceIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlaceCopy: { flex: 1 },
  addPlaceTitle: { fontFamily: fonts.extraBold, fontSize: 16, letterSpacing: -0.25 },
  addPlaceSubtitle: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, marginTop: 3 },
});

export default IdleDiscoveryWorkspace;
