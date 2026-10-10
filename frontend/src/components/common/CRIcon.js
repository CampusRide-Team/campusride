import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, iconSizes, radii, spacing } from '../../theme';

export const CRIcon = ({
  name,
  family = 'Ionicons', // 'Ionicons' | 'Feather' | 'MaterialCommunityIcons'
  size = 'md',          // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'huge' | number
  color = colors.text.primary,
  container = false,    // Renders squircle container matching photo_37 reference style
  containerBg = colors.brand.primaryTint,
  containerRadius = radii.md,
  containerSize = 44,
  style,
  ...rest
}) => {
  const resolvedSize = typeof size === 'number' ? size : iconSizes[size] || iconSizes.md;

  const renderIcon = () => {
    switch (family) {
      case 'Feather':
        return <Feather name={name} size={resolvedSize} color={color} {...rest} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={name} size={resolvedSize} color={color} {...rest} />;
      case 'Ionicons':
      default:
        return <Ionicons name={name} size={resolvedSize} color={color} {...rest} />;
    }
  };

  if (container) {
    return (
      <View
        style={[
          styles.containerBase,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerRadius,
            backgroundColor: containerBg,
          },
          style,
        ]}
      >
        {renderIcon()}
      </View>
    );
  }

  return <View style={style}>{renderIcon()}</View>;
};

const styles = StyleSheet.create({
  containerBase: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CRIcon;
