import { ThemedView } from "@/components/themed-view";
import { Colors, Typography } from "@/constants/theme";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import Toast, { BaseToastProps } from "react-native-toast-message";

import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";

import { ThemedText } from "@/components/themed-text";
import "@/lib/intl-polyfils";
import { ArchivoBlack_400Regular } from "@expo-google-fonts/archivo-black";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import "react-native-get-random-values";

export const unstable_settings = {
  anchor: "(protected)",
};

const toastConfig = {
  /*
    Overwrite 'success' type,
    by modifying the existing `BaseToast` component
  */
  success: (props: BaseToastProps & { props: { action?: () => void; actionText?: string } }) => (
    <View
      style={{
        backgroundColor: Colors.background.secondary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderLeftWidth: 5,
        borderLeftColor: Colors.accent.primary,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 8,
        width: "90%",
        maxWidth: 350,
        alignSelf: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ justifyContent: "center", alignItems: "center", paddingHorizontal: 10 }}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.accent.primary} />
        </View>

        <ThemedText
          style={{
            fontSize: 15,
            fontFamily: Typography.family.primary.medium,
            color: Colors.text.primary,
          }}
        >
          {props.text1}
        </ThemedText>
      </View>
      {props.props?.actionText && (
        <TouchableOpacity style={{ marginRight: 10 }} onPress={props.props?.action}>
          <ThemedText
            style={{ color: Colors.accent.primary, fontFamily: Typography.family.primary.medium }}
          >
            {props.props.actionText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  ),
  in_app: (props: BaseToastProps & { props: { action?: () => void; actionText?: string } }) => (
    <View
      style={{
        backgroundColor: Colors.background.secondary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderLeftWidth: 5,
        borderLeftColor: Colors.accent.primary,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 8,
        width: "90%",
        maxWidth: 350,
        alignSelf: "center",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ justifyContent: "center", alignItems: "center", paddingHorizontal: 10 }}>
          <FontAwesome5 name="user-friends" size={14} color={Colors.accent.primary} />
        </View>
        <View style={{ gap: 3 }}>
          <ThemedText
            style={{
              fontSize: 15,
              fontFamily: Typography.family.primary.medium,
              color: Colors.text.primary,
            }}
          >
            {props.text1}
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 10,
              color: Colors.gray,
            }}
          >
            {props.text2}
          </ThemedText>
        </View>
      </View>
      {props.props?.actionText && (
        <TouchableOpacity style={{ marginRight: 10 }} onPress={props.props?.action}>
          <ThemedText
            style={{ color: Colors.accent.primary, fontFamily: Typography.family.primary.medium }}
          >
            {props.props.actionText}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  ),
};

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
    ArchivoBlack_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <QueryClientProvider client={queryClient}>
        <ThemedView
          style={{
            flex: 1,
            backgroundColor: Colors.background.primary,
          }}
        >
          <Stack screenOptions={{ contentStyle: { backgroundColor: Colors.background.primary } }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(protected)" options={{ headerShown: false }} />
          </Stack>
          <Toast position="bottom" config={toastConfig} bottomOffset={80} swipeable />
        </ThemedView>
        <StatusBar style="light" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
