/**
 * Client-Side Image Compressor
 * Heavy 10-20MB smartphone photos are scaled down and compressed to ~150-250KB in browser memory
 * without any server upload lag or memory freezes.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

export const compressImage = (
  file: File,
  maxWidth: number = 1280,
  maxHeight: number = 1280,
  quality: number = 0.75
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    const originalSizeBytes = file.size;

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Faylni o'qishda xatolik yuz berdi"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasmni yuklashda xatolik"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context yaratilmadi"));
          return;
        }

        // Draw and smoothly scale
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with given quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Calculate approximate size in bytes from base64
        const stringLength = dataUrl.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = Math.round(stringLength * (3 / 4));
        const reduction = Math.max(0, Math.round(((originalSizeBytes - sizeInBytes) / originalSizeBytes) * 100));

        resolve({
          dataUrl,
          originalSizeBytes,
          compressedSizeBytes: sizeInBytes,
          reductionPercentage: reduction,
          width,
          height
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Format bytes to readable string (e.g. "245 KB" or "8.2 MB")
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
