// Icon component using @expo/vector-icons
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';
import { Colors } from '../constants/theme';

// Map of common icon names to MaterialCommunityIcons names
const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    // Navigation
    'home': 'home',
    'dashboard': 'view-dashboard',
    'users': 'account-group',
    'user': 'account',
    'calendar': 'calendar',
    'calendar-check': 'calendar-check',
    'wallet': 'wallet',
    'settings': 'cog',
    'logout': 'logout',

    // Actions
    'plus': 'plus',
    'edit': 'pencil',
    'delete': 'delete',
    'search': 'magnify',
    'filter': 'filter',
    'refresh': 'refresh',
    'close': 'close',
    'check': 'check',
    'chevron-right': 'chevron-right',
    'chevron-left': 'chevron-left',
    'chevron-down': 'chevron-down',
    'chevron-up': 'chevron-up',
    'arrow-left': 'arrow-left',
    'arrow-right': 'arrow-right',

    // Status
    'check-circle': 'check-circle',
    'alert-circle': 'alert-circle',
    'info': 'information',
    'warning': 'alert',
    'error': 'alert-circle',
    'clock': 'clock-outline',
    'clock-check': 'clock-check',

    // Features
    'employee': 'account',
    'attendance': 'calendar-clock',
    'leave': 'calendar-remove',
    'payroll': 'cash-multiple',
    'shift': 'clock-time-four',
    'workflow': 'sitemap',
    'policy': 'file-document',
    'reconciliation': 'file-sync',

    // Misc
    'email': 'email',
    'phone': 'phone',
    'location': 'map-marker',
    'building': 'office-building',
    'money': 'currency-usd',
    'menu': 'menu',
    'dots-vertical': 'dots-vertical',
    'eye': 'eye',
    'eye-off': 'eye-off',
    'x': 'close',
    'refresh-cw': 'refresh',
    'map-pin': 'map-marker',
    'user-plus': 'account-plus',
    'camera': 'camera', // Ensure camera is mapped if used
    'lock': 'lock',
    'server': 'server',
    'database': 'database',
};

interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({
    name,
    size = 24,
    color = Colors.text.primary,
    style,
}) => {
    // Get mapped icon name or use the name directly
    const iconName = iconMap[name] || (name as keyof typeof MaterialCommunityIcons.glyphMap);

    return (
        <MaterialCommunityIcons
            name={iconName}
            size={size}
            color={color}
            style={style}
        />
    );
};

export default Icon;
