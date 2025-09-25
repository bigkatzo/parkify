const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions to keep aspect ratio
      const maxDimension = 1024; // Max width or height
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
};

export interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export const generateSouthParkImage = async (imageFile: File): Promise<GenerateImageResponse> => {
  try {
    // Validate file type
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!supportedTypes.includes(imageFile.type)) {
      return {
        success: false,
        error: `Unsupported file type: ${imageFile.type}. Please use PNG, JPEG, or GIF.`
      };
    }

    // Compress if file is too large (50MB limit for GPT Image) - match original logic exactly
    let processedFile = imageFile;
    if (imageFile.size > 50 * 1024 * 1024) {
      console.log('Image too large, compressing...', { originalSize: imageFile.size });
      processedFile = await compressImage(imageFile);
      console.log('Image compressed', { newSize: processedFile.size });
    } else if (imageFile.size > 10 * 1024 * 1024) {
      // For images between 10MB-50MB, also compress to reduce processing time
      console.log('Large image detected, compressing for faster processing...', { originalSize: imageFile.size });
      processedFile = await compressImage(imageFile);
      console.log('Image compressed', { newSize: processedFile.size });
    }

    // Convert to base64 for backend transmission
    const base64Image = await fileToBase64(processedFile);

    console.log('Sending request with:', {
      fileType: imageFile.type,
      fileSize: imageFile.size,
      fileName: imageFile.name
    });


    // Call our secure serverless function with retry mechanism for HTTP/2 issues
    let response;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to call function...`);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
        
        try {
          response = await fetch('/.netlify/functions/generate-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Connection': 'keep-alive',
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
              image: base64Image
            }),
            signal: controller.signal,
            // Add these options for better connection stability
            keepalive: true
          });
          clearTimeout(timeoutId);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
        
        // If we get here, the request succeeded
        break;
        
      } catch (fetchError) {
        console.error(`Attempt ${retryCount + 1} failed:`, fetchError);
        retryCount++;
        
        if (retryCount > maxRetries) {
          throw fetchError;
        }
        
        // Progressive backoff: wait longer for each retry
        const waitTime = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!response) {
      return {
        success: false,
        error: 'Failed to connect to server after multiple attempts'
      };
    }

    if (!response.ok) {
      let errorMessage = 'Failed to generate image';
      try {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Handle different HTTP status codes with specific messages
        switch (response.status) {
          case 504:
            errorMessage = 'Request timed out. The image may be too large or complex. Please try with a smaller or simpler image.';
            break;
          case 408:
            errorMessage = 'Request timed out. Please try again with a smaller image.';
            break;
          case 413:
            errorMessage = 'Image file is too large. Please use a smaller image.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again in a few moments.';
            break;
          default:
            errorMessage = `Server error (${response.status}). Please try again.`;
        }
      }
      return {
        success: false,
        error: errorMessage
      };
    }

    const data = await response.json();
    
    if (!data.success || !data.imageUrl) {
      return {
        success: false,
        error: data.error || 'No image URL returned'
      };
    }

    return {
      success: true,
      imageUrl: data.imageUrl
    };
    
  } catch (error) {
    console.error('Request failed:', error);
    return {
      success: false,
      error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};