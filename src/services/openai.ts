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

// Convert any image format to PNG (required by OpenAI)
const convertImageToPNG = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image to canvas
      ctx?.drawImage(img, 0, 0);
      
      // Convert to PNG base64
      const pngBase64 = canvas.toDataURL('image/png');
      resolve(pngBase64);
    };
    
    img.onerror = reject;
    
    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
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

    // Convert to PNG format (required by OpenAI) and then to base64
    const base64Image = await convertImageToPNG(processedFile);

    console.log('Sending request with:', {
      originalType: imageFile.type,
      fileSize: imageFile.size,
      fileName: imageFile.name,
      convertedFormat: 'PNG'
    });


    // Call our secure serverless function with retry mechanism for HTTP/2 issues
    let response;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to call function...`);
        
        // Try the optimized fast function first (30 second timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 seconds timeout
        
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
          
          // If the fast function times out, try the background function as fallback
          if ((error as Error).name === 'AbortError' && retryCount === 0) {
            console.log('Fast function timed out, trying background function...');
            try {
              response = await fetch('/.netlify/functions/generate-image-background', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Connection': 'keep-alive',
                  'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                  image: base64Image
                }),
                // Background functions can run much longer
                keepalive: true
              });
            } catch (bgError) {
              throw bgError;
            }
          } else {
            throw error;
          }
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