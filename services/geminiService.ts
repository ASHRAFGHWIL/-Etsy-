
import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedEmail } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEmailContent = async (productDescription: string, productUrl: string): Promise<GeneratedEmail> => {
  if (!productDescription || !productUrl) {
    throw new Error("Product description and URL are required.");
  }

  const prompt = `
أنت خبير تسويق عبر البريد الإلكتروني متخصص في المنتجات الرقمية لمنصة Etsy، وتستهدف العملاء في الأسواق الأمريكية والأوروبية.
مهمتك هي إنشاء بريد إلكتروني تسويقي احترافي، موجز، ومقنع باللغة العربية الفصحى.
يجب أن يحتوي البريد الإلكتروني على سطر عنوان (subject) جذاب ومحتوى (body) يتضمن دعوة واضحة لاتخاذ إجراء (CTA).
يجب أن تكون النبرة احترافية وودودة وجذابة. ركز على الفوائد الرئيسية للمنتج.

معلومات المنتج كالتالي:
- وصف المنتج: ${productDescription}
- رابط المنتج: ${productUrl}

يرجى تقديم المخرج بتنسيق JSON يحتوي على مفتاحين: "subject" و "body". يجب أن يكون المحتوى نصًا واحدًا، ويمكنك استخدام "\\n" للأسطر الجديدة. يجب أن يكون المحتوى جاهزًا للإرسال ومصممًا ليتوافق مع جميع برامج البريد الإلكتروني الرئيسية مثل Gmail و Outlook. استخدم خطوطًا قياسية مثل Arial أو Tahoma.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: "سطر العنوان الجذاب للبريد الإلكتروني."
            },
            body: {
              type: Type.STRING,
              description: "محتوى البريد الإلكتروني الكامل، بتنسيق نصي."
            }
          },
          required: ["subject", "body"],
        }
      }
    });

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);
    
    if (typeof parsedJson.subject === 'string' && typeof parsedJson.body === 'string') {
        return parsedJson as GeneratedEmail;
    } else {
        throw new Error("Invalid JSON structure received from API.");
    }
    
  } catch (error) {
    console.error("Error generating email content:", error);
    throw new Error("فشل في إنشاء محتوى البريد الإلكتروني. يرجى المحاولة مرة أخرى.");
  }
};
