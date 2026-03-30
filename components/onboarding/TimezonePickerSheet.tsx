import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { getTimezoneOptions, TimezoneOption } from "@/constants/timezones";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import Input from "../ui/Input";

type Props = {
  visible: boolean;
  selectedTimezone: string;
  onClose: () => void;
  onSelect: (timezone: TimezoneOption) => void;
};

const TimezonePickerSheet = ({ visible, selectedTimezone, onClose, onSelect }: Props) => {
  const [query, setQuery] = useState("");

  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);

  const filteredTimezones = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return timezoneOptions;

    return timezoneOptions.filter((tz) => {
      return (
        tz.label.toLowerCase().includes(normalized) ||
        tz.subtitle.toLowerCase().includes(normalized) ||
        tz.id.toLowerCase().includes(normalized)
      );
    });
  }, [query, timezoneOptions]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <ThemedText type="defaultSemiBold" style={styles.title}>
              Select timezone
            </ThemedText>
            <TouchableOpacity onPress={handleClose}>
              <ThemedText style={styles.closeText}>CLOSE</ThemedText>
            </TouchableOpacity>
          </View>

          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search city or timezone"
            containerStyle={{
              marginBottom: 16,
            }}
            preIcon={{
              familyIcon: MaterialIcons,
              name: "search",
            }}
          />

          <FlatList
            data={filteredTimezones}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedTimezone;

              return (
                <TouchableOpacity
                  style={[styles.row, isSelected && styles.selectedRow]}
                  onPress={() => {
                    onSelect(item);
                    handleClose();
                  }}
                >
                  <View style={styles.rowTextContainer}>
                    <ThemedText type="defaultSemiBold">{item.label}</ThemedText>
                    <ThemedText style={styles.rowSubtitle}>{item.subtitle}</ThemedText>
                    <ThemedText style={styles.rowId}>{item.id}</ThemedText>
                  </View>

                  {isSelected ? (
                    <View style={styles.selectedDot} />
                  ) : (
                    <View style={styles.unselectedDot} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default TimezonePickerSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    height: "78%",
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: Colors.inputBorder,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.inputBorder,
    alignSelf: "center",
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: Typography.size.md,
  },
  closeText: {
    color: Colors.accent.primary,
    fontSize: Typography.size.xs,
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    minHeight: 72,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.secondary,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedRow: {
    borderColor: Colors.accent.primary,
  },
  rowTextContainer: {
    flex: 1,
    paddingRight: 16,
    gap: 2,
  },
  rowSubtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.size.xs,
  },
  rowId: {
    color: Colors.icon,
    fontSize: 11,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: Colors.accent.primary,
  },
  unselectedDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
});
