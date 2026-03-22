import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Input from '@/components/ui/Input';
import ThemedButton from '@/components/ui/ThemedButton';
import { Colors, Typography } from '@/constants/theme';
import { fromFeetToInches } from '@/lib/utils/conversions';
import { useOnboardingStore } from '@/stores/onboarding-store';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';


const PRIMARY_GRADIENT_COLOR = Colors.accent.primary;
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

type FormInput = {
    feetHeight: string | undefined,
    inchHeight: string | undefined,
    weight: string | undefined,
    bodyFatPercentage: string | undefined
}

const metrics = () => {
    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm({
        defaultValues: {
            feetHeight: undefined,
            inchHeight: undefined,
            weight: undefined,
            bodyFatPercentage: undefined
        } as FormInput,
    });
    const { bodyFatPercentage, feetHeight, inchHeight, weight } = useWatch({ control });
    const router = useRouter()
    const { setMetrics, nextScreen } = useOnboardingStore()

    const isFormValid = useMemo<boolean>(() => {
        return !!bodyFatPercentage && !!feetHeight && !!inchHeight && !!weight
    }, [bodyFatPercentage, feetHeight, inchHeight, weight])

    useEffect(() => {
        if (feetHeight) {
            if (feetHeight.length > 2) {
                setValue("feetHeight", feetHeight.slice(2).toString())
            }
            if (Number(feetHeight) > 10) return setValue("feetHeight", "10")
        }

        if (inchHeight) {
            if (inchHeight.length > 2) {
                setValue("inchHeight", inchHeight.slice(2).toString())
            }
            if (Number(inchHeight) > 11) return setValue("inchHeight", "11")
        }

        if (weight) {
            if (Number(weight) > 1000) return setValue("weight", "1000")
            if (weight.length > 4 && !weight.includes(".")) return setValue("weight", weight.slice(0, 3))
            if (weight.length > 5 && weight.includes(".")) return setValue("weight", weight.slice(0, 5))
        }

        if (bodyFatPercentage) {
            if (bodyFatPercentage.length > 3 && !bodyFatPercentage.includes(".")) return setValue("bodyFatPercentage", bodyFatPercentage.slice(0, 2))
            if (bodyFatPercentage.length > 4 && bodyFatPercentage.includes(".")) return setValue("bodyFatPercentage", bodyFatPercentage.slice(0, 4))
            if (Number(bodyFatPercentage) > 100) return setValue("bodyFatPercentage", "100")
            if (Number(bodyFatPercentage) < 0) return setValue("bodyFatPercentage", "0")
        }

    }, [bodyFatPercentage, inchHeight, feetHeight, weight])

    const handleConfirmMetricsPressed = (data: FormInput) => {
        const { feetHeight, inchHeight, weight, bodyFatPercentage } = data
        if (!isFormValid) return;
        const heightConversion = fromFeetToInches(Number(feetHeight!), Number(inchHeight))
        setMetrics({
            height: heightConversion,
            weight: Number(weight!),
            bodyFatPercentage: Number(bodyFatPercentage!),
        })
        nextScreen()
        router.replace("/(protected)/(onboarding)/weeklyStandard")
    }

    return (
        <ThemedView style={styles.container}>
            <View style={{
                marginBottom: 24
            }}>
                <ThemedText type='subtitle'>SET YOUR{"\n"}STARTING POINT</ThemedText>
                <LinearGradient
                    colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
                    start={{ x: 1.0, y: 0.5 }}
                    end={{ x: 0.0, y: 0.5 }}
                    style={styles.titleUnderline}
                />
            </View>

            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.inputsContainer}>
                    <View>
                        <ThemedText style={styles.inputLabel}>HEIGHT</ThemedText>
                        <View style={{ flexDirection: "row", gap: 10, }}>
                            <View style={{ flex: 1, }}>
                                <Input
                                    name="feetHeight"
                                    control={control}
                                    errors={errors.feetHeight}
                                    placeholder="0"
                                    postText='FT'
                                    keyboardType='number-pad'
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input
                                    name="inchHeight"
                                    control={control}
                                    errors={errors.inchHeight}
                                    placeholder="0"
                                    postText='IN'
                                    keyboardType='number-pad'
                                />
                            </View>
                        </View>

                    </View>
                    <View>
                        <ThemedText style={styles.inputLabel}>BODY WEIGHT</ThemedText>
                        <Input
                            name="weight"
                            control={control}
                            errors={errors.weight}
                            placeholder="0.0"
                            postText='LBS'
                            keyboardType='numeric'
                        />
                    </View>
                    <View>
                        <ThemedText style={styles.inputLabel}>BODY FAT PERCENTAGE</ThemedText>
                        <Input
                            name="bodyFatPercentage"
                            control={control}
                            errors={errors.bodyFatPercentage}
                            placeholder="0.0"
                            postText='%'
                            keyboardType='numeric'
                        />
                    </View>

                </View>
                <View style={styles.infoContainer}>
                    <FontAwesome5 name="info-circle" size={14} color={Colors.accent.secondary} />
                    <ThemedText style={styles.infoText}>You can update this anytime in your profile settings.</ThemedText>
                </View>
                <View style={styles.footerContainer}>
                    <ThemedButton
                        title='CONFIRM METRICS'
                        fontSize={Typography.size.sm}
                        disabled={!isFormValid}
                        onPress={handleSubmit(handleConfirmMetricsPressed)}
                        style={{ width: "100%" }}
                    />
                    <Link href="/(protected)/(onboarding)/weeklyStandard" asChild onPress={() => nextScreen()}>
                        <TouchableOpacity>
                            <ThemedText
                                type="defaultSemiBold"
                                style={{
                                    color: Colors.gray,
                                }}
                            >
                                SKIP FOR NOW
                            </ThemedText>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </ThemedView>
    )
}

export default metrics

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
    inputsContainer: {
        gap: 15
    },
    inputLabel: {
        color: Colors.gray,
        fontFamily: Typography.family.secondary.medium,
        marginBottom: 5,
        fontSize: Typography.size.xs
    },
    infoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 32
    },
    infoText: {
        color: Colors.text.secondary,
        fontSize: Typography.size.xs
    },
    footerContainer: {
        alignItems: "center",
        gap: 15,
        justifyContent: "flex-end",
        paddingBottom: 20,
        marginTop: 15,
        flex: 1,
    },
})