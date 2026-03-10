/**
 * CRMPro Design System
 *
 * Unified design tokens and constants for consistent UI/UX across the application.
 * This system ensures visual consistency and proper spacing, typography, and colors.
 */

// ============================================
// SPACING SYSTEM (4px base scale)
// ============================================
export const spacing = {
  // Base units
  xs: "0.25rem",   // 4px
  sm: "0.5rem",    // 8px
  md: "1rem",      // 16px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
  "2xl": "3rem",   // 48px
  "3xl": "4rem",   // 64px

  // Component-specific
  cardPadding: "1rem",      // 16px
  cardPaddingLg: "1.5rem",  // 24px
  buttonPadding: "0.5rem 1rem", // 8px 16px
  inputPadding: "0.5rem 0.75rem", // 8px 12px

  // Layout gaps
  gapXS: "0.25rem",  // 4px
  gapSM: "0.5rem",   // 8px
  gapMD: "1rem",     // 16px
  gapLG: "1.5rem",   // 24px
  gapXL: "2rem",     // 32px
} as const;

// ============================================
// TYPOGRAPHY
// ============================================
export const typography = {
  // Font families
  fontFamily: {
    sans: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },

  // Font sizes
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    "2xl": "1.5rem",  // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },

  // Font weights
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  // Line heights
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  none: "0",
  sm: "0.25rem",   // 4px
  md: "0.375rem",  // 6px
  lg: "0.5rem",    // 8px
  xl: "0.75rem",   // 12px
  "2xl": "1rem",   // 16px
  full: "9999px",
} as const;

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",

  // Card shadows
  card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  cardHover: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  cardDrag: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

// ============================================
// Z-INDEX LAYERS
// ============================================
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

// ============================================
// TRANSITIONS
// ============================================
export const transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

// ============================================
// COMPONENT SIZES
// ============================================
export const componentSizes = {
  // Button sizes
  button: {
    sm: {
      height: "2.25rem",  // 36px
      padding: "0.5rem 0.75rem", // 8px 12px
      fontSize: "0.875rem", // 14px
    },
    md: {
      height: "2.5rem",   // 40px
      padding: "0.5rem 1rem", // 8px 16px
      fontSize: "0.875rem", // 14px
    },
    lg: {
      height: "2.75rem",  // 44px
      padding: "0.75rem 1.5rem", // 12px 24px
      fontSize: "1rem", // 16px
    },
    icon: {
      sm: "1.5rem", // 24px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
    },
  },

  // Input sizes
  input: {
    sm: {
      height: "2.25rem",  // 36px
      padding: "0.5rem 0.75rem",
      fontSize: "0.875rem",
    },
    md: {
      height: "2.5rem",   // 40px
      padding: "0.5rem 0.75rem",
      fontSize: "0.875rem",
    },
    lg: {
      height: "2.75rem",  // 44px
      padding: "0.75rem 1rem",
      fontSize: "1rem",
    },
  },

  // Card padding
  card: {
    sm: "0.75rem",  // 12px
    md: "1rem",     // 16px
    lg: "1.5rem",   // 24px
  },

  // Avatar sizes
  avatar: {
    xs: "1.5rem",  // 24px
    sm: "2rem",    // 32px
    md: "2.5rem",  // 40px
    lg: "3rem",    // 48px
    xl: "4rem",    // 64px
  },
} as const;

// ============================================
// BREAKPOINTS (for reference)
// ============================================
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ============================================
// LAYOUT CONSTRAINTS
// ============================================
export const layout = {
  container: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  sidebar: {
    collapsed: "5rem",  // 80px
    expanded: "18rem",  // 288px
  },
  header: {
    height: "4rem", // 64px
  },
} as const;

// ============================================
// INTERACTION STATES
// ============================================
export const interactionStates = {
  hover: {
    scale: "1.015",
    brightness: "1.05",
  },
  active: {
    scale: "0.98",
  },
  focus: {
    ringOffset: "2px",
    ringWidth: "2px",
  },
} as const;

// ============================================
// ACCESSIBILITY
// ============================================
export const accessibility = {
  minTouchTarget: "2.75rem", // 44px - minimum touch target size
  focusVisible: "ring-2 ring-ring ring-offset-2",
  srOnly: "sr-only",
} as const;

// ============================================
// UTILITY CLASSES GENERATORS
// ============================================
export const getCardClasses = (variant: "default" | "hover" | "drag" = "default") => {
  const base = "bg-card border rounded-lg transition-all";
  const variants = {
    default: `${base} ${shadows.card}`,
    hover: `${base} ${shadows.card} hover:${shadows.cardHover} hover:-translate-y-0.5`,
    drag: `${base} ${shadows.cardDrag} opacity-50`,
  };
  return variants[variant];
};

export const getButtonClasses = (variant: "primary" | "secondary" | "ghost" = "primary", size: "sm" | "md" | "lg" = "md") => {
  const sizes = componentSizes.button[size];
  return `h-${sizes.height} ${sizes.padding} text-${sizes.fontSize}`;
};

// ============================================
// COLOR UTILITIES
// ============================================
export const semanticColors = {
  success: "hsl(142 76% 36%)",
  warning: "hsl(38 92% 50%)",
  error: "hsl(0 84.2% 60.2%)",
  info: "hsl(199 89% 48%)",
} as const;

// Status colors for badges
export const statusColors = {
  // Client status
  client: {
    LEAD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    PROSPECT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    CUSTOMER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    CHURNED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  // Deal/Project status
  status: {
    NOT_STARTED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    ON_HOLD: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  // Task priority
  priority: {
    LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
} as const;
