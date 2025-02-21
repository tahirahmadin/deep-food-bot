import imageCompression from "browser-image-compression";
import { analyzeImageWithS3 } from "../actions/serverActions";

export class ImageService {
  async analyzeImage(file: File): Promise<string> {
    try {
      // Optionally compress the image before upload
      const options = {
        maxSizeMB: 0.1, // Compress image to a max of 500KB
        maxWidthOrHeight: 200, // Resize dimensions if needed
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      console.log("Compressed file ready:", compressedFile);

      // Instead of converting to Base64, send the file directly
      const analysisResult = await analyzeImageWithS3(compressedFile);
      return analysisResult;
    } catch (error) {
      console.error("Analysis error:", error);
      throw error;
    }
  }
}

