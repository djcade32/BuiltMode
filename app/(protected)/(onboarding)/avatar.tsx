import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ThemedButton from "@/components/ui/ThemedButton";
import { Colors, Typography } from "@/constants/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import {
    useCameraPermissions
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Link } from "expo-router";
import React, { useEffect } from "react";
import { Alert, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";


const PRIMARY_GRADIENT_COLOR = Colors.accent.primary;
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const avatar = () => {
    const { nextScreen } = useOnboardingStore();

    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        (async () => {
            if (permission && !permission.granted && permission.canAskAgain) {
                requestPermission();
            }

        })();
    }, [permission]);

    // if (!permission) {
    //     // Camera permissions are still loading.
    //     return <View />;
    // }

    // if (
    //     (permission && !permission.granted && !permission.canAskAgain)
    // ) {
    //     return (
    //         <View></View>
    //         //   <View style={styles.permissionContainer}>
    //         //     <Text style={styles.permissionText}>
    //         //       We need your permission to use the camera and microphone
    //         //     </Text>
    //         //     <Button title="Grant Permission" onPress={() => Linking.openSettings()} />
    //         //   </View>
    //     );
    // }

    const selectFromGallery = async () => {
        // No permissions request is necessary for launching the image library.
        // Manually request permissions for videos on iOS when `allowsEditing` is set to `false`
        // and `videoExportPreset` is `'Passthrough'` (the default), ideally before launching the picker
        // so the app users aren't surprised by a system dialog after picking a video.
        // See "Invoke permissions for videos" sub section for more details.
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert("Permission required", "Permission to access the media library is required.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
        });

        console.log(result);

        // if (!result.canceled) {
        //   const uri = result.assets[0].uri;
        //   setVideo(uri);
        //   await videoPlayer.replaceAsync(uri);
        //   videoPlayer.play();
        // }
    };
    return (
        <ThemedView style={styles.container}>
            <View>
                <View
                    style={{
                        marginBottom: 24,
                    }}
                >
                    <ThemedText type="subtitle">CREATE YOUR{"\n"}IDENTITY</ThemedText>
                    <LinearGradient
                        colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
                        start={{ x: 1.0, y: 0.5 }}
                        end={{ x: 0.0, y: 0.5 }}
                        style={styles.titleUnderline}
                    />
                </View>
                <View>
                    <ThemedText style={styles.subText}>
                        Add a profile photo so your circle knows who's putting in the work.
                    </ThemedText>
                </View>
            </View>

            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={65} color={Colors.inputBorder} />
                    <Pressable style={styles.avatarCircleButton}>
                        <FontAwesome6 name="camera" size={18} color={Colors.background.primary} />
                    </Pressable>
                </View>
            </View>

            <View style={styles.footerContainer}>
                <ThemedButton
                    title="UPLOAD PHOTO"
                    fontSize={Typography.size.sm}
                    disabled={false}
                    onPress={() => { }}
                />
                <Link href="/(protected)/(onboarding)/homeTimezone" asChild onPress={() => nextScreen()}>
                    <TouchableOpacity>
                        <ThemedText
                            style={{
                                color: Colors.icon,
                                fontFamily: Typography.family.primary.medium,
                                textAlign: "center",
                                fontSize: 14,
                            }}
                        >
                            SKIP FOR NOW
                        </ThemedText>
                    </TouchableOpacity>
                </Link>
                <ThemedText
                    style={{
                        color: Colors.icon,
                        textAlign: "center",
                        fontSize: 12,
                    }}
                >
                    You can change this anytime in your profile.
                </ThemedText>
            </View>
        </ThemedView>
    );
};

export default avatar;

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
    avatarCircle: {
        height: 180,
        width: 180,
        borderRadius: 180 / 2,
        backgroundColor: Colors.background.secondary,
        borderWidth: 2,
        borderColor: Colors.inputBorder,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarCircleButton: {
        backgroundColor: Colors.accent.primary,
        width: 40,
        height: 40,
        borderRadius: 40 / 2,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: Colors.background.primary,
        position: "absolute",
        bottom: 6,
        right: 6,
    },
    footerContainer: {
        gap: 32,
        justifyContent: "flex-end",
        paddingBottom: 20,
    },
});
