import { Colors, Typography } from '@/constants/theme'
import { useOnboardingStore } from '@/stores/onboarding-store'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'

const ScreenTracker = () => {
    const { numOfScreens, currentScreen } = useOnboardingStore()

    return (
        <ThemedView style={styles.container}>
            <View style={styles.dotsContainer}>
                {Array.from({ length: numOfScreens }).map((_, index) =>
                    <View
                        key={index}
                        style={[styles.dot, { opacity: currentScreen >= index + 1 ? 1 : .25 }]}
                    />)}
            </View>
            <ThemedText style={styles.stepText}>STEP {currentScreen}/{numOfScreens}</ThemedText>
        </ThemedView>
    )
}

export default ScreenTracker

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 32,
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row"
    },
    dotsContainer: {
        flexDirection: "row",
        gap: 6,
    },
    dot: {
        height: 6,
        width: 6,
        borderRadius: 3,
        backgroundColor: Colors.accent.primary,
    },
    stepText: {
        fontFamily: Typography.family.secondary.regular,
        fontSize: Typography.size.xs,
        color: Colors.text.secondary
    }
})