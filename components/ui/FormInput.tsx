import { Border, Colors, Typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Controller, FieldError, FieldValues, RegisterOptions } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { ThemedText } from "../themed-text";

type props = TextInputProps & {
  name: string;
  control: any;
  errors: FieldError | undefined;
  preIcon?: { familyIcon: any; name: string; color?: string };
  postIcon?: { familyIcon: any; name: string; color?: string };
  postText?: string;
  label?: string;
  password?: boolean;
  rules?:
    | Omit<
        RegisterOptions<FieldValues, string>,
        "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
      >
    | undefined;
  onFoucus?: () => void;
  onBlur?: () => void;
  changePostIconColorOnFocus?: boolean;
  changePreIconColorOnFocus?: boolean;
};

const FormInput = ({
  control,
  errors,
  preIcon,
  postIcon,
  postText,
  label,
  name,
  password,
  style,
  placeholder,
  rules,
  onFocus,
  onBlur,
  changePostIconColorOnFocus = true,
  changePreIconColorOnFocus = true,
  ...rest
}: props) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const renderIcon = (
    familyIcon: any,
    name: string,
    color?: string,
    changeColorOnFocus?: boolean,
  ) => {
    return React.createElement(familyIcon, {
      name: name,
      size: 16,
      color: changeColorOnFocus ? Colors.accent.primary : color ? color : Colors.text.primary,
    });
  };

  const preIconComponent =
    preIcon &&
    renderIcon(
      preIcon.familyIcon,
      preIcon.name,
      preIcon.color,
      isFocused && changePreIconColorOnFocus,
    );
  const postIconComponent = postText ? (
    <Text style={styles.postText}>{postText}</Text>
  ) : (
    postIcon &&
    renderIcon(
      postIcon.familyIcon,
      postIcon.name,
      postIcon.color,
      isFocused && changePostIconColorOnFocus,
    )
  );
  const passwordIconComponent = showPassword
    ? renderIcon(Ionicons, "eye-off", undefined, false)
    : renderIcon(Ionicons, "eye", undefined, false);

  return (
    <View>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onBlur: fieldOnBlur, onChange, value } }) => (
          <View style={styles.container}>
            {label && (
              <ThemedText style={[styles.label, isFocused && { color: Colors.accent.primary }]}>
                {label}
              </ThemedText>
            )}
            <View
              style={[
                styles.inputContainer,
                { borderColor: isFocused ? Colors.accent.primary : Colors.cardBorder },
              ]}
            >
              {preIconComponent}

              <TextInput
                testID={label}
                accessibilityLabel={label}
                placeholder={placeholder}
                onBlur={(e) => {
                  setIsFocused(false);
                  fieldOnBlur();
                  onBlur && onBlur(e);
                }}
                onChangeText={onChange}
                onFocus={(e) => {
                  setIsFocused(true);
                  onFocus && onFocus(e);
                }}
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
        <ThemedText style={styles.errorText}>
          {errors.message || `Must be a valid ${name}`}
        </ThemedText>
      )}
    </View>
  );
};

export default FormInput;

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

    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,

    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    borderWidth: 2,
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
  postText: {
    fontFamily: Typography.family.secondary.medium,
    color: Colors.gray,
  },
});
