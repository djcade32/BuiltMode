// lib/widgets/getWorkoutWidgetLogoUri.ts

import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { widgetsDirectory } from "expo-widgets";

const fullLogoModule = require("@/assets/images/live_widget_logo.png");

let cachedLogoUri: string | null = null;

export const getWorkoutWidgetLogoUri = async (): Promise<string> => {
  if (cachedLogoUri) {
    return cachedLogoUri;
  }

  const asset = Asset.fromModule(fullLogoModule);

  await asset.downloadAsync();

  const sourceUri = asset.localUri ?? asset.uri;

  if (!sourceUri.startsWith("file://")) {
    throw new Error(`BuiltMode widget logo did not resolve to a local file: ${sourceUri}`);
  }

  const sourceFile = new File(sourceUri);

  const widgetLogoFile = new File(widgetsDirectory, "builtmode-full-logo.png");

  await sourceFile.copy(widgetLogoFile, {
    overwrite: true,
  });

  console.log("Widget logo file:", {
    uri: widgetLogoFile.uri,
    exists: widgetLogoFile.exists,
    size: widgetLogoFile.size,
    type: widgetLogoFile.type,
  });

  cachedLogoUri = widgetLogoFile.uri;

  return widgetLogoFile.uri;
};
