import { Handler } from '@netlify/functions';
import FormData from 'form-data';

// Use CommonJS require for node-fetch
const fetch = require('node-fetch');

const OPENAI_API_URL = 'https://api.openai.com/v1/images/edits';

// South Park prompt - keeping the exact same prompt
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

const handler: Handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }


  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyStart: apiKey?.substring(0, 10) || 'none'
    });
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'OpenAI API key not configured. Please check your Netlify environment variables.'
        })
      };
    }

    if (apiKey.includes('your_ope') || apiKey.includes('************')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'OpenAI API key is still using placeholder value. Please check your Netlify environment variables.'
        })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No image data provided'
        })
      };
    }

    // Parse the request body
    const { image } = JSON.parse(event.body);
    
    console.log('Processing request with:', {
      dataLength: image.length,
      base64Length: image.split(',')[1].length
    });

    // Create FormData for the Image API - match original exactly
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', SOUTH_PARK_PROMPT);
    
    // Handle base64 image data - recreate the original file format
    const base64Data = image.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Determine the original file type from the base64 header
    const mimeMatch = image.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const fileExtension = mimeType.split('/')[1] || 'png';
    
    formData.append('image', imageBuffer, {
      filename: `image.${fileExtension}`,
      contentType: mimeType
    });
    
    formData.append('size', '1024x1024'); // Standard size for edits endpoint
    formData.append('quality', 'medium'); // Medium quality for faster generation

    console.log('Sending request to OpenAI');

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      // @ts-ignore - node-fetch types issue with FormData
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `OpenAI Error: ${errorData.error?.message || 'Unknown error'}`
        })
      };
    }

    const data = await response.json();
    console.log('OpenAI Response:', JSON.stringify(data, null, 2));
    
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'No image data returned from OpenAI Image API'
        })
      };
    }

    // Check if we have either URL or base64 data
    const imageData = data.data[0];
    let imageUrl: string;
    
    if (imageData.url) {
      // If we get a URL, use it directly
      imageUrl = imageData.url;
    } else if (imageData.b64_json) {
      // If we get base64 data, return it as is
      imageUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'No image URL or base64 data in response'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        imageUrl: imageUrl
      })
    };

  } catch (error) {
    console.error('Request failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    };
  }
};

export { handler };
