import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { fonts, spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export const ActivityDateHeader = ({ title }) => {
  const { theme } = useTheme();
  const { colors } = theme;

  if (!title) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.secondary }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: 11,
    fontFamily: fonts.manrope.extraBold,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

export default ActivityDateHeader;
