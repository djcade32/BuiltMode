import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import ThemedButton from '@/components/ui/ThemedButton'
import { Colors, Typography } from '@/constants/theme'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

const PRIMARY_GRADIENT_COLOR = Colors.accent.primary;
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const homeTimezone = () => {
    return (
        <ThemedView style={styles.container}>
            <View>
                <View
                    style={{
                        marginBottom: 24,
                    }}
                >
                    <ThemedText type="subtitle">CONFIRM YOUR{"\n"}TIMEZONE</ThemedText>
                    <LinearGradient
                        colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
                        start={{ x: 1.0, y: 0.5 }}
                        end={{ x: 0.0, y: 0.5 }}
                        style={styles.titleUnderline}
                    />
                </View>
                <View>
                    <ThemedText style={styles.subText}>
                        Your timezone determines when your training day and week reset.
                    </ThemedText>
                </View>
            </View>

            <View>
                <View>
                    <View>
                        <ThemedText>AUTO-DETECTED</ThemedText>
                        <Pressable>
                            <ThemedText>CHANGE</ThemedText>
                        </Pressable>
                    </View>
                    <ThemedText>United States - Eastern Time</ThemedText>
                    <ThemedText>UTC - 5</ThemedText>
                    <View>
                        <ThemedText>Daily reset: 4:00 AM local time</ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.footerContainer}>
                <ThemedText
                    style={{
                        color: Colors.icon,
                        textAlign: "center",
                        fontSize: 12,
                    }}
                >
                    This setting affects streaks, weekly targets, and Mode Score.
                </ThemedText>
                <ThemedButton
                    title="CONFIRM TIMEZONE"
                    fontSize={Typography.size.sm}
                    disabled={false}
                    onPress={() => { }}
                />


            </View>
        </ThemedView>
    )
}

export default homeTimezone

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 32,
    },
    titleUnderline: {
        height: 1.5,
        width: 50,
        marginTop: 10,
    },
    subText: {
        color: Colors.gray,
        fontSize: 14,
        lineHeight: 22,
    },
    footerContainer: {
        gap: 32,
        justifyContent: "flex-end",
        paddingBottom: 20,
    },
})