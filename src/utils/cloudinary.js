/**
 * Cloudinary Utility (Disabled)
 * 
 * Cloudinary integration has been removed/disabled for now.
 * File uploads currently fall back to local Data URLs (FileReader).
 * 
 * To re-connect Cloudinary in the future:
 * 1. Install axios: `npm install axios`
 * 2. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your `.env` file
 * 3. Uncomment the `uploadToCloudinary` implementation below.
 */

// Placeholder helper function returning local Data URL if called
export const uploadToCloudinary = async (file, resourceType = "auto") => {
  console.warn(
    "Cloudinary upload is currently disabled. Returning local Data URL."
  );
  if (!file) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
};

/*
// --- UNCOMMENT BELOW TO RE-ENABLE CLOUDINARY UPLOADS ---
import axios from "axios";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset";

export const uploadToCloudinary = async (file, resourceType = "auto") => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error?.response?.data || error.message);
    const errorMsg = error?.response?.data?.error?.message || "Failed to upload file to Cloudinary.";
    throw new Error(errorMsg);
  }
};
*/
