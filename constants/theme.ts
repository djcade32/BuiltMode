/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

export const Colors = {
  text: {
    primary: "white",
    secondary: "#8A8F98",
  },
  background: {
    primary: "#0F1113",
    secondary: "#15181C",
  },
  accent: {
    primary: "#C6A34A",
    secondary: "#4A6C8C",
  },
  icon: "#6B7280",
  tabIconDefault: "#6B7280",
  gray: "#9CA3AF",
  input: "#1F2228",
  cardBorder: "#1F2228",
  inputBorder: "#2A2E35",
  error: "#FF6347",
};

export const Typography = {
  size: {
    /**
     * @property {8}
     */
    xxs: 8,
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 50,
  },
  family: {
    primary: {
      regular: "Inter_400Regular",
      medium: "Inter_500Medium",
      semibold: "Inter_600SemiBold",
      bold: "Inter_700Bold",
    },
    secondary: {
      regular: "JetBrainsMono_400Regular",
      medium: "JetBrainsMono_500Medium",
      semibold: "JetBrainsMono_600SemiBold",
      bold: "JetBrainsMono_700Bold",
    },
    tertiary: {
      regular: "ArchivoBlack_400Regular",
    },
  },
};

export const Border = {
  radius: {
    sm: 5,
    md: 8,
    lg: 20,
  },
};

export const Debug = {
  1: {
    borderColor: "red",
    borderWidth: 1,
  },
  2: {
    borderColor: "blue",
    borderWidth: 1,
  },
  3: {
    borderColor: "orange",
    borderWidth: 1,
  },
  4: {
    borderColor: "white",
    borderWidth: 1,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
