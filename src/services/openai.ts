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

    // Test if function is reachable first
    console.log('Testing function connectivity...');
    try {
      const testResponse = await fetch('/.netlify/functions/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('Function test successful:', testData);
      } else {
        console.warn('Function test failed:', testResponse.status);
      }
    } catch (testError) {
      console.error('Function connectivity test failed:', testError);
    }

    // Call our secure serverless function
    const response = await fetch('/.netlify/functions/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image
      })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate image';
      try {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON (e.g., 504 timeout)
        errorMessage = response.status === 504 
          ? 'Request timed out. Please try again with a smaller image.'
          : `Server error (${response.status}). Please try again.`;
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