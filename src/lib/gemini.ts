import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface StudyContent {
  title: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export async function analyzeTextbookImage(base64Image: string): Promise<StudyContent> {
  const model = "gemini-3-flash-preview";
  
  console.log("Starting textbook analysis with Gemini...");
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze the attached textbook page. \n1. Identify important keywords and concepts.\n2. Create exactly 10 flashcards (front/back format).\n3. Create 3 multiple-choice questions with 4 options each.\n4. For each quiz question, provide a helpful learning 'explanation'.\n\nOutput only a valid JSON object matching the requested schema." },
            { 
              inlineData: { 
                mimeType: "image/jpeg", 
                data: base64Image.split(',')[1] || base64Image 
              } 
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Relevant title for the section" },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                },
                required: ["front", "back"]
              }
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "flashcards", "quiz"]
        }
      }
    });

    const text = response.text;

    if (!text) {
      console.error("Gemini returned empty text response");
      throw new Error("The AI couldn't generate content for this image. Is it a readable textbook page?");
    }

    return JSON.parse(text) as StudyContent;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error.message?.includes("User location is not supported")) {
      throw new Error("The AI service is currently unavailable in your region. Please try again later.");
    }
    throw error;
  }
}
