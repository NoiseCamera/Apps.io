
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Helper to clean base64 string
const cleanBase64 = (data) => {
    return data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

const getMimeType = (data) => {
    const match = data.match(/^data:(image\/[a-zA-Z]+);base64,/);
    return match ? match[1] : 'image/png';
}

export const editImageWithAI = async (imageBase64, prompt) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // Using gemini-2.5-flash-image for image-to-image editing
        const model = "gemini-2.5-flash-image";

        const mimeType = getMimeType(imageBase64);
        const imagePart = {
            inlineData: {
                data: cleanBase64(imageBase64),
                mimeType: mimeType,
            },
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    imagePart,
                    { text: prompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        // Extract image from response
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }

        throw new Error("No image generated from AI.");

    } catch (error) {
        console.error("AI Edit Error:", error);
        throw error;
    }
};

export const generateAIMask = async (imageBase64, target = 'person') => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash-image";

        const mimeType = getMimeType(imageBase64);
        const imagePart = {
            inlineData: {
                data: cleanBase64(imageBase64),
                mimeType: mimeType,
            },
        };

        // ULTRA-PRECISION PROMPT
        let prompt = "Role: Expert Computer Vision Segmentation Engine.\n";
        prompt += "Task: Create a high-fidelity, pixel-perfect binary segmentation mask.\n";
        prompt += "Input: An image.\n";
        prompt += "Output: A black and white mask image ONLY. Same dimensions/aspect ratio as input.\n";
        prompt += "Definitions:\n";
        prompt += "- WHITE (255,255,255): The exact target area (Foreground).\n";
        prompt += "- BLACK (0,0,0): Everything else (Background).\n";
        prompt += "Strict Rules:\n";
        prompt += "1. EDGES must be extremely sharp and follow the object boundary exactly (pixel-perfect).\n";
        prompt += "2. NO stray pixels, noise, or hallucinations in the black area.\n";
        prompt += "3. FILL the target area completely (solid white).\n";
        prompt += "4. Do not crop, resize, or distort the original aspect ratio.\n";

        switch (target) {
            case 'background':
                prompt += "TARGET OBJECT: The BACKGROUND environment. Select the entire environment behind the main subject(s). Precisely mask out the person.";
                break;
            case 'hair':
                prompt += "TARGET OBJECT: HAIR & WIG only. Select all hair strands, bangs, ponytails, buns, and cosplay wigs. Include stray hairs if possible. Exclude face skin, ears, and headwear/accessories unless heavily intertwined.";
                break;
            case 'face_only':
                prompt += "TARGET OBJECT: FACIAL SKIN only. Select the skin of the face. Exclude eyes, lips, mouth interior, eyebrows, and hair/wigs. This is for skin retouching.";
                break;
            case 'skin':
            case 'face':
                prompt += "TARGET OBJECT: EXPOSED SKIN. Select all visible skin areas (Face, hands, arms, legs, body). Exclude clothing, jewelry, and hair.";
                break;
            case 'clothes':
                prompt += "TARGET OBJECT: COSTUME / OUTFIT. Select all garments, cosplay armor, dresses, and shoes. Exclude exposed skin, hair, and held props if they are distinct.";
                break;
            case 'person':
            default:
                prompt += "TARGET OBJECT: THE PERSON / CHARACTER. Select the complete human figure including hair, wig, costume, accessories, and held props. Exclude the background environment entirely.";
                break;
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [imagePart, { text: prompt }]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("AI did not return a mask image.");
    } catch (error) {
        console.error("AI Mask Error", error);
        throw error;
    }
}

export const generateAIMaskFromPoint = async (imageBase64, x, y) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash-image";

        const mimeType = getMimeType(imageBase64);
        const imagePart = {
            inlineData: {
                data: cleanBase64(imageBase64),
                mimeType: mimeType,
            },
        };

        // MAGIC WAND PROMPT
        let prompt = "Role: Interactive Segmentation Engine (Magic Wand).\n";
        prompt += `Task: Identify the specific distinct object located at relative coordinates X=${x.toFixed(3)}, Y=${y.toFixed(3)} (0.0-1.0 scale).\n`;
        prompt += "Action: Generate a binary mask for that ENTIRE object.\n";
        prompt += "Logic:\n";
        prompt += "- If the point is on a wig, select the whole wig.\n";
        prompt += "- If on a piece of armor, select the whole armor piece.\n";
        prompt += "- If on the background, select the background.\n";
        prompt += "Output Spec:\n";
        prompt += "- White = Selected Object.\n";
        prompt += "- Black = Everything else.\n";
        prompt += "- Precise edges, solid fill, no noise.";

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [imagePart, { text: prompt }]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("AI did not return a mask image.");
    } catch (error) {
        console.error("AI Point Mask Error", error);
        throw error;
    }
}

export const generateCosplayCaption = async (imageBase64) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash";

        const mimeType = getMimeType(imageBase64);
        const imagePart = {
            inlineData: {
                data: cleanBase64(imageBase64),
                mimeType: mimeType,
            },
        };

        const prompt = "You are a social media manager for a famous cosplayer. Analyze this cosplay photo. Provide a catchy, engaging caption for Instagram (max 2 sentences) and a list of 10 relevant, trending hashtags. Return JSON.";

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [imagePart, { text: prompt }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        caption: { type: Type.STRING },
                        hashtags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["caption", "hashtags"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No text response");

        return JSON.parse(text);

    } catch (error) {
        console.error("Caption Gen Error:", error);
        throw error;
    }
}
