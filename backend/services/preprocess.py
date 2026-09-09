import sys
import os
from PIL import Image, ImageEnhance, ImageOps, ImageFilter

def preprocess_image(input_path):
    try:
        if not os.path.exists(input_path):
            print(input_path)
            return

        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_clean.png"

        with Image.open(input_path) as img:
            # Convert to RGB then Grayscale
            rgb = img.convert('RGB')
            
            # Upscale if the image is too small for OCR (minimum 1200px width/height)
            width, height = rgb.size
            if width < 1000 or height < 1000:
                scale = max(1000 / width, 1000 / height)
                rgb = rgb.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)

            gray = rgb.convert('L')
            
            # Enhance contrast
            contrast_enhancer = ImageEnhance.Contrast(gray)
            enhanced = contrast_enhancer.enhance(1.6)
            
            # Autocontrast to normalize black/white distribution
            normalized = ImageOps.autocontrast(enhanced, cutoff=1)
            
            # Subtle unsharp mask to clarify blurred packaging text
            sharpened = normalized.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

            sharpened.save(output_path, format='PNG')
            print(output_path)
    except Exception as e:
        # Fallback to original image on any failure
        print(input_path, file=sys.stderr)
        print(input_path)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        preprocess_image(sys.argv[1])
    else:
        sys.exit(1)
