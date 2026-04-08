import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A high-quality, vibrant logo for a slot machine game named "Lucy Fruits". The logo features colorful, juicy fruits like cherries, bananas, and watermelons, with the text "Lucy Fruits" in a fun, retro arcade style. Dark background with glowing neon accents, perfect for a casino game.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Image = part.inlineData.data;
        fs.writeFileSync('public/logo.jpg', Buffer.from(base64Image, 'base64'));
        console.log('Logo generated successfully at public/logo.jpg');
        break;
      }
    }
  } catch (err) {
    console.error('Error generating logo:', err);
  }
}

main();
