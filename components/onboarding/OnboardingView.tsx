import { Colors } from '@/constants/theme'
import React, { PropsWithChildren } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenTracker from './SceeenTracker'

type props = PropsWithChildren
const OnboardingView = (props: props) => {
    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: Colors.background.primary }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >

            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
                <ScreenTracker />
                <View style={styles.accentArt1} />
                <View style={styles.accentArt2} />
                {props.children}
            </SafeAreaView>
        </KeyboardAvoidingView>
    )
}

export default OnboardingView

const styles = StyleSheet.create({
    accentArt1: {
        position: "absolute",
        height: 64,
        width: 4,
        left: 0,
        top: 300,
        opacity: 0.2,
        backgroundColor: Colors.accent.primary,
        zIndex: 100
    },
    accentArt2: {
        position: "absolute",
        height: 48,
        width: 4,
        right: 0,
        bottom: 240,
        opacity: 0.2,
        backgroundColor: Colors.accent.secondary,
        zIndex: 100
    },
})