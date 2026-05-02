import { Border, Colors } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import {
  Menu,
  MenuOption,
  MenuOptionCustomStyle,
  MenuOptions,
  MenuOptionsCustomStyle,
  MenuTrigger,
  renderers,
} from "react-native-popup-menu";
import { ThemedText } from "../themed-text";

export type DropdownMenuOption = {
  onSelect?(): any;
  text: string;
  menuOptionCustomStyles?: MenuOptionCustomStyle;
  icon?: React.ReactElement;
  disabled?: boolean;
};

type DropdownMenuProps = {
  options: DropdownMenuOption[];
  menuOptionsCustomStyles?: MenuOptionsCustomStyle;
  menuTriggerStyle?: ViewStyle;
  renderTriggerItem?: React.ReactElement;
  onClose?: () => void;
  onOpen?: () => void;
};

const DropdownMenu = ({
  onClose,
  onOpen,
  renderTriggerItem = <MaterialIcons name="more-horiz" size={22} color={Colors.icon} />,
  options,
  menuOptionsCustomStyles,
  menuTriggerStyle,
}: DropdownMenuProps) => {
  return (
    <Menu
      renderer={renderers.ContextMenu}
      rendererProps={{ placement: "bottom" }}
      onClose={onClose}
      onOpen={onOpen}
      style={{ ...menuTriggerStyle }}
    >
      <MenuTrigger customStyles={{ TriggerTouchableComponent: TouchableOpacity }} onPress={onClose}>
        {renderTriggerItem}
      </MenuTrigger>
      <MenuOptions
        customStyles={{
          optionsContainer: [
            styles.dropdownOptionsContainer,
            menuOptionsCustomStyles?.optionsContainer,
          ],
          optionText: menuOptionsCustomStyles?.optionText,
          optionTouchable: menuOptionsCustomStyles?.optionTouchable,
        }}
      >
        {options.map((option, index) => (
          <MenuOption
            key={index}
            onSelect={option.onSelect}
            customStyles={{
              OptionTouchableComponent: TouchableOpacity,
              optionWrapper: [
                styles.dropdownOptionContainer,
                index !== options.length - 1
                  ? { borderBottomColor: Colors.inputBorder, borderBottomWidth: 1 }
                  : {},
                option?.menuOptionCustomStyles?.optionWrapper,
                { opacity: option.disabled ? 0.4 : 1 },
              ],
              optionText: option?.menuOptionCustomStyles?.optionText,
              optionTouchable: option?.menuOptionCustomStyles?.optionTouchable,
            }}
            disabled={option.disabled}
          >
            {option.icon ? <View>{option.icon}</View> : null}
            <ThemedText style={styles.dropdownOptionText}>{option.text}</ThemedText>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  );
};

export default DropdownMenu;

const styles = StyleSheet.create({
  dropdownBackdrop: {
    backgroundColor: Colors.background.primary,
    opacity: 0.8,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  dropdownOptionsContainer: {
    backgroundColor: Colors.input,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: 3,
    zIndex: 101,
  },
  dropdownOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
  },
  dropdownOptionText: {
    fontSize: 12,
    color: Colors.gray,
    letterSpacing: 0.6,
  },
});
