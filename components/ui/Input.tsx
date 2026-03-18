import { Border, Colors, Typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Controller, FieldError, FieldValues, RegisterOptions } from "react-hook-form";
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { ThemedText } from "../themed-text";

type props = TextInputProps & {
  name: string;
  control: any;
  errors: FieldError | undefined;
  preIcon?: { familyIcon: any; name: string };
  postIcon?: { familyIcon: any; name: string };
  label?: string;
  password?: boolean;
  rules?:
    | Omit<
        RegisterOptions<FieldValues, string>,
        "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
      >
    | undefined;
};

const Input = ({
  control,
  errors,
  preIcon,
  postIcon,
  label,
  name,
  password,
  style,
  placeholder,
  rules,
  ...rest
}: props) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const renderIcon = (familyIcon: any, name: string, changeColorOnFocus?: boolean) => {
    return React.createElement(familyIcon, {
      name: name,
      size: 16,
      color: changeColorOnFocus ? Colors.accent.primary : Colors.text.primary,
    });
  };

  const preIconComponent = preIcon && renderIcon(preIcon.familyIcon, preIcon.name, isFocused);
  const postIconComponent = postIcon && renderIcon(postIcon.familyIcon, postIcon.name, isFocused);
  const passwordIconComponent = showPassword
    ? renderIcon(Ionicons, "eye-off", false)
    : renderIcon(Ionicons, "eye", false);

  return (
    <View>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.container}>
            {label && (
              <ThemedText style={[styles.label, isFocused && { color: Colors.accent.primary }]}>
                {label}
              </ThemedText>
            )}
            <View
              style={[
                styles.inputContainer,
                { borderColor: isFocused ? Colors.accent.primary : Colors.inputBorder },
              ]}
            >
              {preIconComponent}

              <TextInput
                testID={label}
                accessibilityLabel={label}
                placeholder={placeholder}
                onBlur={() => {
                  setIsFocused(false);
                  return onBlur();
                }}
                onChangeText={onChange}
                onFocus={() => setIsFocused(true)}
                value={value}
                placeholderTextColor={Colors.text.secondary}
                style={[styles.textInput, style]}
                cursorColor={Colors.text.primary}
                selectionColor={Colors.text.primary}
                secureTextEntry={password && !showPassword}
                {...rest}
              />
              {password ? (
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  {passwordIconComponent}
                </Pressable>
              ) : (
                postIconComponent
              )}
            </View>
          </View>
        )}
      />
      {errors && (
        <ThemedText style={styles.errorText}>{errors.message || "This is required."}</ThemedText>
      )}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    gap: 5,
  },
  label: {
    color: Colors.text.secondary,
    fontFamily: Typography.family.secondary.regular,
    fontSize: Typography.size.xs,
  },
  inputContainer: {
    paddingHorizontal: 10,

    backgroundColor: Colors.input,
    borderRadius: Border.radius.md,

    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    borderWidth: 1,
  },
  textInput: {
    fontFamily: Typography.family.secondary.regular,
    paddingVertical: 15,
    flex: 1,
    color: Colors.text.primary,
  },
  errorText: {
    color: "red",
    fontSize: Typography.size.xs,
    marginTop: 5,
  },
});
