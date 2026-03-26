import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from "./firebase";

export async function uploadImageAsync(uri: string, storageUrl: string) {
  try {
    if (!uri || app == null) return;
    // Why are we using XMLHttpRequest? See:
    // https://github.com/expo/expo/issues/2402#issuecomment-443726662
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const fileRef = ref(getStorage(), storageUrl);
    const result = await uploadBytes(fileRef, blob as Blob);

    // We're done with the blob, close and release it
    //@ts-ignore
    blob.close();
    return await getDownloadURL(fileRef).then((url) => {
      if (url) {
        console.log("Image uploaded: ", url);
        return url;
      }
    });
  } catch (error) {
    throw Error(`ERROR: There was a problem uploading the image: ${error}`);
  }
}
