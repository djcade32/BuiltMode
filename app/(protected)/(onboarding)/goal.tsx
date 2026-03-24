import GoalItem from '@/components/onboarding/GoalItem'
import OnboardingView from '@/components/onboarding/OnboardingView'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import ThemedButton from '@/components/ui/ThemedButton'
import { Colors, Typography } from '@/constants/theme'
import { GoalType } from '@/packages/shared/src/types/onboarding'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

const GOALS: {
    key: string,
    title: GoalType,
    description: string,
}[] = [
        {
            key: "build_muscle",
            title: "BUILD MUSCLE",
            description: "Hypertrophy-focused training with progressive overload"
        },
        {
            key: "cut_body_fat",
            title: "CUT BODY FAT",
            description: "Caloric deficit with muscle preservation protocols"
        },
        {
            key: "increase_strength",
            title: "INCREASE STRENGTH",
            description: "Powerlifting-style programming for max lifts"
        },
        {
            key: "improve_conditioning",
            title: "IMPROVE CONDITIONING",
            description: "Cardiovascular endurance and work capacity"
        },
        {
            key: "general_discipline",
            title: "GENERAL DISCIPLINE",
            description: "Balanced approach to overall fitness and consistency"
        },

    ]

const PRIMARY_GRADIENT_COLOR = Colors.accent.primary;
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;


const goal = () => {
    const router = useRouter()
    const { setGoal, nextScreen } = useOnboardingStore()
    const [selected, setSelected] = useState<GoalType | undefined>(undefined)

    const handleGoalSelected = (goal: GoalType) => {
        setSelected(goal)
    }

    const handleContinuePressed = () => {
        selected && setGoal(selected)
        nextScreen()
        router.replace("/(protected)/(onboarding)/metrics")
    }

    return (
        <OnboardingView>
            <ThemedView style={styles.container}>


                <View style={{
                    marginBottom: 24
                }}>
                    <ThemedText type='subtitle'>WHAT ARE YOU{"\n"}BUILDING TOWARD?</ThemedText>
                    <LinearGradient
                        colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
                        start={{ x: 1.0, y: 0.5 }}
                        end={{ x: 0.0, y: 0.5 }}
                        style={styles.titleUnderline}
                    />
                </View>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.goalsContainer}
                >
                    {GOALS.map(({ title, description, key }) => <GoalItem key={key} title={title} description={description} onSelected={handleGoalSelected} selected={selected} />)}
                </ScrollView>
                <View style={{ marginTop: 25 }}>
                    <ThemedButton
                        title='CONFIRM GOAL'
                        fontSize={Typography.size.sm}
                        disabled={!selected}
                        onPress={handleContinuePressed}
                    />
                </View>

            </ThemedView>
        </OnboardingView>
    )
}

export default goal

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
    goalsContainer: {
        gap: 12,
        paddingBottom: 32,
    },
})