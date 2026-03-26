import OnboardingView from "@/components/onboarding/OnboardingView";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ThemedButton from "@/components/ui/ThemedButton";
import { Colors, Typography } from "@/constants/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

const PRIMARY_GRADIENT_COLOR = Colors.accent.primary;
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const avatar = () => {
  const router = useRouter();
  const { nextScreen, setAvatarUrl } = useOnboardingStore();
  const [facing, setFacing] = useState<CameraType>("back");

  const [showCameraView, setShowCameraView] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | undefined>(undefined);
  const [savedPhoto, setSavedPhoto] = useState<string | undefined>(undefined);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    askForCameraPermissions();
  }, [permission]);

  const askForCameraPermissions = async () => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  };

  const selectFromGallery = async () => {
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
    if (!result.assets) return;
    setSavedPhoto(result.assets[0].uri);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (photo?.uri) {
      const uri = photo.uri;
      setSelectedPhoto(uri);
    }
  };

  const handleAvatarButtonPressed = () => {
    Alert.alert("Choose Profile Photo", "", [
      {
        text: "Take Photo",
        onPress: async () => {
          await askForCameraPermissions();
          setShowCameraView(true);
        },
      },
      {
        text: "Select Photo",
        onPress: () => selectFromGallery(),
      },
      {
        text: "Cancel",
        style: "destructive",
      },
    ]);
  };

  const renderPhotoPreview = (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <Ionicons
          name="close"
          size={40}
          color="white"
          onPress={() => setSelectedPhoto(undefined)}
          suppressHighlighting
        />
      </View>
      <Image source={{ uri: selectedPhoto }} style={{ flex: 1 }} />
      <View style={styles.photoPreviewFooter}>
        <ThemedButton
          title="SAVE PHOTO"
          preIcon={{
            familyIcon: MaterialIcons,
            name: "save",
            size: 18,
          }}
          fontSize={Typography.size.sm}
          disabled={false}
          onPress={() => {
            setSavedPhoto(selectedPhoto);
            setShowCameraView(false);
            setSelectedPhoto(undefined);
            setFacing("back");
          }}
        />
      </View>
    </View>
  );

  const renderCameraView = (
    <>
      {selectedPhoto ? (
        renderPhotoPreview
      ) : (
        <View style={{ flex: 1 }}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
          <View style={styles.topBar}>
            <Ionicons
              name="close"
              size={40}
              color="white"
              onPress={() => {
                setFacing("back");
                setShowCameraView(false);
              }}
              suppressHighlighting
            />
          </View>
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.recordButton} onPress={takePhoto} />
            <Ionicons
              name="camera-reverse"
              size={40}
              color="white"
              onPress={toggleCameraFacing}
              suppressHighlighting
              style={styles.reverseCameraIcon}
            />
          </View>
        </View>
      )}
    </>
  );

  const handleUploadPhotoPressed = () => {
    if (!savedPhoto) return;
    setAvatarUrl(savedPhoto);
    nextScreen();
    router.replace("/(protected)/(onboarding)/homeTimezone");
  };

  return (
    <>
      {showCameraView && renderCameraView}
      {!showCameraView && !selectedPhoto && (
        <OnboardingView>
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
                {savedPhoto ? (
                  <Image
                    source={{ uri: savedPhoto }}
                    style={{
                      height: 176,
                      width: 176,
                      borderRadius: 176 / 2,
                    }}
                  />
                ) : (
                  <Ionicons name="person" size={65} color={Colors.inputBorder} />
                )}
                <Pressable style={styles.avatarCircleButton} onPress={handleAvatarButtonPressed}>
                  <FontAwesome6 name="camera" size={18} color={Colors.background.primary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.footerContainer}>
              <ThemedButton
                title="UPLOAD PHOTO"
                fontSize={Typography.size.sm}
                disabled={!savedPhoto}
                onPress={handleUploadPhotoPressed}
              />
              <Link
                href="/(protected)/(onboarding)/homeTimezone"
                asChild
                onPress={() => nextScreen()}
              >
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
        </OnboardingView>
      )}
    </>
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
    color: Colors.icon,
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
  camera: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 55,
    left: 15,
    zIndex: 100,
  },
  bottomControls: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  recordButton: {
    width: 80,
    height: 80,
    backgroundColor: "white",
    borderRadius: 40,
  },
  reverseCameraIcon: {
    position: "absolute",
    bottom: 20,
    right: 30,
  },
  photoPreviewFooter: {
    position: "absolute",
    bottom: 45,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
});
