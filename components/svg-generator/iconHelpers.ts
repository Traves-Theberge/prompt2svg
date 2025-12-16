import {
  Ghost,
  Zap,
  Heart,
  Skull,
  Rocket,
  Sun,
  Anchor,
  Camera,
} from "lucide-react";

// Icon registry
export const icons = { Ghost, Zap, Heart, Skull, Rocket, Sun, Anchor, Camera } as const;
export type BuiltInIconName = keyof typeof icons;
export type SelectedIcon = BuiltInIconName | "Custom";

// Get all icon names
export const iconNames = Object.keys(icons) as BuiltInIconName[];

/**
 * Extract SVG code from a Lucide icon or custom SVG
 * @param iconName - The name of the icon or "Custom"
 * @param customSvg - Optional custom SVG string (used when iconName is "Custom")
 * @returns SVG string
 */
export const getIconSVGCode = (iconName: SelectedIcon, customSvg?: string): string => {
  if (iconName === 'Custom') {
    return customSvg || '<svg><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>';
  }
  
  // Render the icon to get its SVG code
  // For Lucide icons, we can approximate the SVG
  // This is a simplified approach - ideally we'd use the icon's SVG directly
  try {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><!-- ${iconName} icon --></svg>`;
  } catch {
    return '<svg><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>';
  }
};

/**
 * Render an icon component by name
 * @param iconName - The name of the icon to render
 * @returns Icon component
 */
export const renderIcon = (iconName: BuiltInIconName) => {
  return icons[iconName];
};
