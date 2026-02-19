import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

// --- Helper: Compress Image using Canvas ---
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Resize logic: More aggressive compression for Firestore storage
                // Max width 800px is sufficient for mobile/web product cards
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = height * (MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // Compress to JPEG with 0.6 quality to keep file size low (<100KB usually)
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(dataUrl);
                } else {
                    reject(new Error("Canvas context error"));
                }
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// --- Helper: Convert DataURL to Blob ---
const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
};

/**
 * Uploads a file with Fallback mechanism.
 * 1. Compresses image.
 * 2. Tries to upload to Firebase Storage (with 3s timeout).
 * 3. If fails (CORS, permission, timeout), returns Base64 string directly.
 */
export const uploadImage = async (file: File, pathPrefix: string = 'uploads'): Promise<string> => {
  try {
    // 1. Compress first
    const compressedDataUrl = await compressImage(file);
    const compressedBlob = dataURLtoBlob(compressedDataUrl);

    // 2. Try Storage Upload
    try {
        if (!storage) throw new Error("Storage not configured");
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const storageRef = ref(storage, `${pathPrefix}/${uniqueName}`);
        
        // Create a promise that rejects after 3 seconds (Fast fail for fallback)
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Upload Timeout")), 3000)
        );

        const uploadTask = uploadBytes(storageRef, compressedBlob);
        
        // Race between upload and timeout
        await Promise.race([uploadTask, timeoutPromise]);
        
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;

    } catch (storageError) {
        // Silent fallback for smooth UX
        // console.warn("Using Base64 Fallback due to storage issue.");
        
        // 3. Fallback: Return Base64 string directly
        return compressedDataUrl;
    }

  } catch (error) {
    console.error("Critical Error processing image:", error);
    throw new Error("이미지 처리 중 오류가 발생했습니다.");
  }
};
