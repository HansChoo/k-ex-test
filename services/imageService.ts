
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file object to upload
 * @param pathPrefix Optional folder path (default: 'uploads')
 */
export const uploadImage = async (file: File, pathPrefix: string = 'uploads'): Promise<string> => {
  try {
    // Create a unique filename: timestamp_random_originalName
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`;
    const storageRef = ref(storage, `${pathPrefix}/${uniqueName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("이미지 업로드에 실패했습니다.");
  }
};
