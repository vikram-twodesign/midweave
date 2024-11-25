import OpenAI from 'openai';
import { AIAnalysis } from '@/lib/types/schema';

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Helper function to convert File to base64
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Main analysis function
export async function analyzeImage(file: File): Promise<AIAnalysis> {
  try {
    const base64Image = await fileToBase64(file);
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    // Combined analysis in a single request to reduce API calls
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image comprehensively and return a JSON response with the following structure:
              {
                "description": "A detailed 2-3 line description of the image and its style",
                "imageType": "The type of image (e.g., Photograph, Illustration, Digital Art, 3D Render, Anime, etc.)",
                "style": {
                  "primary": "main style description",
                  "secondary": ["list", "of", "secondary", "styles"],
                  "influences": ["artistic", "influences"]
                },
                "technical": {
                  "quality": "description of image quality",
                  "renderStyle": "rendering technique used",
                  "detailLevel": "detail assessment",
                  "lighting": "lighting description"
                },
                "colors": {
                  "palette": ["#HEX1", "#HEX2", "#HEX3"],
                  "mood": "color mood description",
                  "contrast": "contrast assessment"
                },
                "tags": {
                  "style": ["style", "related", "tags"],
                  "technical": ["technical", "aspect", "tags"],
                  "mood": ["mood", "related", "tags"]
                }
              }`
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    // Parse the response
    const analysisText = response.choices[0].message.content;
    if (!analysisText) {
      throw new Error('No analysis received from API');
    }

    // Extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const analysis: AIAnalysis = JSON.parse(jsonMatch[0]);

    // Validate the analysis structure
    if (!analysis.description || !analysis.imageType || !analysis.style || !analysis.technical || !analysis.colors || !analysis.tags) {
      throw new Error('Invalid analysis structure received');
    }

    return analysis;
  } catch (error) {
    console.error('AI Analysis error:', error);
    throw new Error('Failed to analyze image');
  }
} 