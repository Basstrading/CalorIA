const MAX_WIDTH = 768;
const MAX_HEIGHT = 768;
const JPEG_QUALITY = 0.6;

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Chargement image trop long. Reessaie avec une photo plus legere.'));
    }, 10_000);

    img.onload = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas non supporte')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Compression echouee. Reessaie avec une photo JPEG.')),
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('Format image non supporte. Prends une photo directement avec l\'appareil.'));
    };
    img.src = url;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URI prefix (e.g. "data:image/jpeg;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function fileToBase64(file: File): Promise<string> {
  const compressed = await compressImage(file);
  return blobToBase64(compressed);
}
