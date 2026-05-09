import { Border, Colors, Typography } from "@/constants/theme";
import React, { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native";

type props = TextInputProps & {
  containerStyle?: ViewStyle;
  preIcon?: { familyIcon: any; name: string; color?: string };
  postIcon?: { familyIcon: any; name: string; color?: string };
  preText?: string;
  preTextStyle?: TextStyle;
  postText?: string;
  postTextStyle?: TextStyle;
};

const Input = ({
  containerStyle,
  preIcon,
  postIcon,
  preText,
  preTextStyle,
  postText,
  postTextStyle,
  style,
  onBlur,
  onFocus,
  ...rest
}: props) => {
  const textInputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const renderIcon = (familyIcon: any, name: string) => {
    return React.createElement(familyIcon, {
      name: name,
      size: 16,
      color: isFocused ? Colors.accent.primary : Colors.icon,
    });
  };

  const preIconComponent = preText ? (
    <Text style={[styles.postText, preTextStyle]}>{preText}</Text>
  ) : (
    preIcon && renderIcon(preIcon.familyIcon, preIcon.name)
  );

  const postIconComponent = postText ? (
    <Text style={[styles.postText, postTextStyle]}>{postText}</Text>
  ) : (
    postIcon && renderIcon(postIcon.familyIcon, postIcon.name)
  );

  return (
    <Pressable
      onPress={() => textInputRef.current?.focus()}
      style={[
        styles.container,
        {
          ...containerStyle,
          borderColor: isFocused
            ? Colors.accent.primary
            : (containerStyle?.borderColor ?? Colors.cardBorder),
        },
      ]}
    >
      {preIconComponent}
      <TextInput
        {...rest}
        ref={textInputRef}
        style={[styles.textInput, style]}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        cursorColor={Colors.text.primary}
        selectionColor={Colors.text.primary}
      />
      {postIconComponent}
    </Pressable>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    paddingHorizontal: 14,
    backgroundColor: Colors.background.secondary,
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
  },
  textInput: {
    color: Colors.text.primary,
    paddingVertical: 15,
    paddingHorizontal: 5,
    flex: 1,
  },
  postText: {
    fontFamily: Typography.family.secondary.medium,
    color: Colors.gray,
  },
});
