import type { Area } from 'react-easy-crop';

function loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load selected image.'));
        image.src = imageUrl;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob === null) {
                reject(new Error('Failed to prepare cropped avatar.'));
                return;
            }

            resolve(blob);
        }, type);
    });
}

export async function buildCroppedAvatarFile(
    imageUrl: string,
    croppedAreaPixels: Area,
    originalName: string,
    mimeType: string,
): Promise<File> {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    const context = canvas.getContext('2d');
    if (context === null) {
        throw new Error('Failed to prepare cropped avatar.');
    }

    context.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
    );

    const blob = await canvasToBlob(canvas, mimeType);
    return new File([blob], originalName, { type: mimeType });
}
