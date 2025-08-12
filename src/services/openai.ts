const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

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

const convertImageToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 data
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SOUTH_PARK_PROMPT = `Transform this photo into a perfect, high-quality illustration in the exact style of the original South Park TV show, as if it were officially drawn by the show's animators.

Character accuracy:
• The exact same number of people as in the original photo must appear — no additional or missing characters.
• Preserve each person's distinctive features: hairstyle, hair color, facial hair, skin tone, eye shape, glasses, clothing colors, accessories, and body type, adapted into South Park's flat color style.
• Keep all subjects in the exact same pose, facial expression, position, and arrangement as in the original photo.

South Park style rules:
• Large round head (40–50% of total height).
• Big circular white eyes with small black pupils.
• Mitten-style hands without separate fingers.
• Small blocky body with simplified limbs.
• Solid, flat colors with bold black outlines; no shading, gradients, or realistic textures.

Clothing and colors:
• Match the colors of clothing and accessories exactly from the original photo.
• Keep patterns simple but recognizable in South Park style.

Background:
• Simplify the background into either a flat single-color background or a classic South Park setting (street, classroom, living room, snowy mountain town).
• Match the perspective so that the group composition remains identical to the original.

Output quality:
• The final image must be clean, sharp, and visually indistinguishable from actual South Park animation frames.
• No extra objects, props, characters, or text unless explicitly stated.
• Maintain correct proportions for all characters to fit naturally in the South Park universe.

Please generate this South Park style illustration.`;

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

    // Convert image to base64
    const base64Image = await convertImageToBase64(processedFile);

    console.log('Sending request with:', {
      fileType: processedFile.type,
      fileSize: processedFile.size,
      fileName: processedFile.name
    });

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: SOUTH_PARK_PROMPT
              },
              {
                type: 'input_image',
                image_url: `data:${processedFile.type};base64,${base64Image}`
              }
            ]
          }
        ],
        tools: [
          {
            type: 'image_generation',
            quality: 'high',
            size: 'auto'
          }
        ]
      })
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
    console.log('Output array length:', data.output?.length);
    console.log('Output array contents:', JSON.stringify(data.output, null, 2));
    
    // Log each output item individually
    data.output?.forEach((item, index) => {
      console.log(`Output item ${index}:`, item);
      console.log(`Output item ${index} type:`, item.type);
      console.log(`Output item ${index} keys:`, Object.keys(item));
    });
    console.log('Response output array:', data.output);
    console.log('Output types:', data.output?.map((o: any) => o.type));

    // Extract image from response
    const imageGenerationCalls = data.output?.filter((output: any) => {
      console.log('Checking output:', output.type, output);
      return output.type === 'image_generation_call';
    });
    
    console.log('Found image generation calls:', imageGenerationCalls);
    
    if (!imageGenerationCalls || imageGenerationCalls.length === 0) {
      return {
        success: false,
        error: `No image generation call found in response. Available output types: ${data.output?.map((o: any) => o.type).join(', ') || 'none'}`
      };
    }

    const imageBase64 = imageGenerationCalls[0].result;
    if (!imageBase64) {
      return {
        success: false,
        error: 'No image data returned from GPT Image'
      };
    }

    // Convert base64 to blob URL for display
    const imageBlob = new Blob([Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))], { type: 'image/png' });
    const imageUrl = URL.createObjectURL(imageBlob);

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