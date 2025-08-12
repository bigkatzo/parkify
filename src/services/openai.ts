const OPENAI_API_URL = 'https://api.openai.com/v1/images/edits';

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



const SOUTH_PARK_PROMPT = `Transform this image into a cartoon illustration in the distinctive South Park TV show animation style. Create original cartoon characters inspired by the composition and general scene, using South Park's signature art style:

Art Style Requirements:
• Large round heads (40–50% of character height)
• Big circular white eyes with small black pupils
• Simple mitten-style hands without individual fingers
• Small blocky bodies with simplified limbs
• Solid, flat colors with bold black outlines
• No shading, gradients, or realistic textures

Character Design:
• Create new cartoon characters inspired by the scene
• Use South Park's typical color palette and character proportions
• Maintain the general composition and arrangement from the reference
• Apply South Park's signature clothing and accessory style

Background:
• Simplify to either a flat color background or classic South Park setting
• Use the show's typical environmental style (snowy mountain town, simple interiors, etc.)

Output Quality:
• Clean, sharp illustration matching official South Park animation quality
• Maintain South Park's characteristic simplicity and bold visual style`;



export interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export const generateSouthParkImage = async (imageFile: File): Promise<GenerateImageResponse> => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyStart: apiKey?.substring(0, 10) || 'none'
    });
    
    if (!apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.'
      };
    }

    if (apiKey.includes('your_ope') || apiKey.includes('************')) {
      return {
        success: false,
        error: 'OpenAI API key is still using placeholder value. Please check your Netlify environment variables.'
      };
    }

    // Validate file type - GPT Image supports PNG, JPEG, and GIF
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!supportedTypes.includes(imageFile.type)) {
      return {
        success: false,
        error: `Unsupported file type: ${imageFile.type}. Please use PNG, JPEG, or GIF.`
      };
    }

    // Compress if file is too large (50MB limit for GPT Image)
    let processedFile = imageFile;
    if (imageFile.size > 50 * 1024 * 1024) {
      console.log('Image too large, compressing...', { originalSize: imageFile.size });
      processedFile = await compressImage(imageFile);
      console.log('Image compressed', { newSize: processedFile.size });
    }



    console.log('Sending request with:', {
      fileType: processedFile.type,
      fileSize: processedFile.size,
      fileName: processedFile.name
    });

    // Create FormData for the Image API
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', SOUTH_PARK_PROMPT);
    formData.append('image', processedFile);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return {
        success: false,
        error: `OpenAI Error: ${errorData.error?.message || 'Unknown error'}`
      };
    }

    const data = await response.json();
    console.log('OpenAI Response:', JSON.stringify(data, null, 2));
    
    // Handle Image API response format
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return {
        success: false,
        error: 'No image data returned from OpenAI Image API'
      };
    }

    // The Image API returns URLs by default
    const imageUrl = data.data[0].url;
    if (!imageUrl) {
      return {
        success: false,
        error: 'No image URL in response'
      };
    }

    return {
      success: true,
      imageUrl: imageUrl
    };
    
  } catch (error) {
    console.error('Request failed:', error);
    return {
      success: false,
      error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};