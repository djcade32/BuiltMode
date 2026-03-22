import { Border, Colors, Typography } from '@/constants/theme';
import { GoalType } from '@/packages/shared/src/types/onboarding';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';

type props = {
    title: GoalType;
    description: string;
    selected: string | undefined;
    onSelected: (goal: GoalType) => void;
}
const GoalItem = ({ title, description, selected, onSelected }: props) => {
    const isSelected = selected === title

    const handleSelect = () => {
        onSelected(title)
    }
    return (
        <Pressable style={[styles.container, { borderColor: isSelected ? Colors.accent.primary : Colors.cardBorder, }]} onPress={handleSelect}>
            <View style={{ flexShrink: 1 }}>
                <ThemedText style={styles.title}>{title}</ThemedText>
                <ThemedText style={[styles.description]}>{description}</ThemedText>
            </View>
            <View >
                <View style={[
                    styles.circle,
                    {
                        backgroundColor: isSelected ? Colors.accent.primary : "",
                        outlineColor: isSelected ? Colors.accent.primary : Colors.inputBorder,
                    }]} />
            </View>
        </Pressable>
    )
}

export default GoalItem

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.background.secondary,
        borderWidth: 2,
        gap: 10,
        borderRadius: Border.radius.md,
        flexDirection: "row",
        padding: 20
    },
    title: {
        fontSize: 18,
        fontFamily: Typography.family.primary.bold,
        marginBottom: 3
    },
    description: {
        color: Colors.gray,
        fontSize: 14,
        lineHeight: 22,
    },
    circle: {
        height: 15,
        width: 15,
        borderRadius: 10,
        outlineWidth: 2,
    },
})