import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedEmail } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEmailContent = async (productDescription: string, productUrl: string, customPrompt?: string, recipientCount?: number): Promise<GeneratedEmail> => {
  if (!productDescription || !productUrl) {
    throw new Error("Product description and URL are required.");
  }

  let audienceInstruction = '';
  if (recipientCount !== undefined && recipientCount > 0) {
      if (recipientCount === 1) {
          audienceInstruction = 'ملاحظة هامة: الرسالة موجهة لمستلم واحد. يجب استخدام صيغة المفرد المذكر للمخاطبة ونبرة شخصية ومباشرة (مثال: "لك خصيصاً"، "اكتشفْ"، "نتمنى أن ينال إعجابك").';
      } else if (recipientCount === 2) {
          audienceInstruction = 'ملاحظة هامة: الرسالة موجهة لمستلمين اثنين. يجب استخدام صيغة المثنى للمخاطبة (مثال: "لكما"، "اكتشفا"، "نتمنى أن ينال إعجابكما").';
      } else if (recipientCount >= 3 && recipientCount <= 10) {
          audienceInstruction = `ملاحظة هامة: الرسالة موجهة لمجموعة صغيرة من ${recipientCount} عملاء. يجب استخدام صيغة جمع القلة للمخاطبة (مثال: "لكم"، "اكتشفوا"، "نتمنى أن ينال إعجابكم").`;
      } else { // recipientCount > 10
          audienceInstruction = `ملاحظة هامة: الرسالة موجهة لمجموعة كبيرة من ${recipientCount} عميلاً. يجب استخدام صيغة جمع الكثرة ونبرة أكثر عمومية (مثال: "لكم جميعاً"، "ندعوكم لاكتشاف").`;
      }
  }


  let prompt: string;

  if (customPrompt && customPrompt.trim() !== '') {
    prompt = customPrompt
      .replace(/{{productDescription}}/g, productDescription)
      .replace(/{{productUrl}}/g, productUrl);
  } else {
    prompt = `
أنت خبير تسويق عبر البريد الإلكتروني متخصص في المنتجات الرقمية لمنصة Etsy، وتستهدف العملاء في الأسواق الأمريكية والأوروبية.
مهمتك هي إنشاء بريد إلكتروني تسويقي احترافي، موجز، ومقنع باللغة العربية الفصحى.
${audienceInstruction ? audienceInstruction + '\n' : ''}يجب أن يحتوي البريد الإلكتروني على سطر عنوان (subject) جذاب ومحتوى (body) يتضمن دعوة واضحة لاتخاذ إجراء (CTA).
يجب أن تكون النبرة احترافية وودودة وجذابة. ركز على الفوائد الرئيسية للمنتج.

معلومات المنتج كالتالي:
- وصف المنتج: ${productDescription}
- رابط المنتج: ${productUrl}

يرجى تقديم المخرج بتنسيق JSON يحتوي على مفتاحين: "subject" و "body". يجب أن يكون المحتوى نصًا واحدًا، ويمكنك استخدام "\\n" للأسطر الجديدة. يجب أن يكون المحتوى جاهزًا للإرسال ومصممًا ليتوافق مع جميع برامج البريد الإلكتروني الرئيسية مثل Gmail و Outlook. استخدم خطوطًا قياسية مثل Arial أو Tahoma.
  `;
  }


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