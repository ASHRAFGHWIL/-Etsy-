import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedEmail } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEmailContent = async (productDescription: string, productUrl: string, language: 'ar' | 'en-US', customPrompt?: string, recipientCount?: number, recipientTitle?: string): Promise<GeneratedEmail> => {
  if (!productDescription || !productUrl) {
    throw new Error("Product description and URL are required.");
  }

  let pluralizationInstruction = '';
  let salutationInstruction = '';
  let prompt: string;

  if (customPrompt && customPrompt.trim() !== '') {
    // Note: Pluralization and salutation instructions are not added to custom prompts to give user full control.
    prompt = customPrompt
      .replace(/{{productDescription}}/g, productDescription)
      .replace(/{{productUrl}}/g, productUrl);
  } else {
    if (language === 'en-US') {
      if (recipientTitle) {
          const titleMap: { [key: string]: string } = {
              'السيد': 'Mr.',
              'السيدة': 'Ms.',
              'السادة': 'Sirs/Madams',
              'الأستاذ': 'Professor',
              'الأستاذة': 'Professor',
          };
          const englishTitle = titleMap[recipientTitle] || recipientTitle;
          salutationInstruction = `The email should start with a formal salutation, addressing the recipient as "${englishTitle}". For example: "Dear ${englishTitle},"`;
      }
      if (recipientCount !== undefined && recipientCount > 0) {
        pluralizationInstruction = `Note on addressing: This email is for ${recipientCount} recipient(s). Please adjust the copy accordingly (e.g., singular for 1, plural for more than 1).`;
      }
      prompt = `
You are an expert email marketer specializing in digital products for the Etsy platform, targeting customers in the US and European markets.
Your task is to create a professional, concise, and persuasive marketing email in American English.
${salutationInstruction}
${pluralizationInstruction}
The email must include a catchy subject line and a body with a clear call-to-action (CTA).
The tone should be professional, friendly, and engaging. You may strategically include relevant and professional emojis to add a touch of personality and visual appeal.

The entire email content must be centered around the specific product detailed below. Use the product description to highlight its features and benefits, and ensure the CTA link directs to the provided product URL.

Product information is as follows:
- Product Description: ${productDescription}
- Product URL: ${productUrl}

Please provide the output in a JSON format with two keys: "subject" and "body". The body should be a single text string; you can use "\\n" for new lines. The content should be ready to send and designed to be compatible with all major email clients like Gmail and Outlook. Use standard fonts like Arial or Tahoma.
      `;
    } else { // Default to Arabic
      if (recipientTitle) {
          salutationInstruction = `ابدأ البريد الإلكتروني بتحية رسمية ومناسبة باستخدام اللقب "${recipientTitle}". على سبيل المثال: "السيد/السيدة المحترم(ة)،" أو ما شابه.`;
      }
      if (recipientCount !== undefined && recipientCount > 0) {
        pluralizationInstruction = `
ملاحظة حول المخاطبة: البريد موجه إلى ${recipientCount} مستلم(ين). يجب تكييف اللغة المستخدمة لتتوافق مع قواعد اللغة العربية للتعدد (singular, dual, plural):
- إذا كان عدد المستلمين 1 (one)، استخدم صيغة المفرد.
- إذا كان عدد المستلمين 2 (two)، استخدم صيغة المثنى.
- إذا كان عدد المستلمين 3 أو أكثر (other)، استخدم صيغة الجمع.
`;
      }
      prompt = `
أنت خبير تسويق عبر البريد الإلكتروني متخصص في المنتجات الرقمية لمنصة Etsy، وتستهدف العملاء في الأسواق الأمريكية والأوروبية.
مهمتك هي إنشاء بريد إلكتروني تسويقي احترافي، موجز، ومقنع باللغة العربية الفصحى.
${salutationInstruction}
${pluralizationInstruction}
يجب أن يحتوي البريد الإلكتروني على سطر عنوان (subject) جذاب ومحتوى (body) يتضمن دعوة واضحة لاتخاذ إجراء (CTA).
يجب أن تكون النبرة احترافية وودودة وجذابة. يمكنك إضافة رموز تعبيرية (emojis) بشكل احترافي ومناسب للسياق لإضفاء لمسة جمالية وجاذبية على البريد الإلكتروني.

من الضروري أن يتمحور محتوى البريد الإلكتروني بالكامل حول المنتج المحدد أدناه. استخدم وصف المنتج لإبراز مميزاته وفوائده، وتأكد من أن رابط الدعوة لاتخاذ الإجراء (CTA) يوجه إلى رابط المنتج المرفق.

معلومات المنتج كالتالي:
- وصف المنتج: ${productDescription}
- رابط المنتج: ${productUrl}

يرجى تقديم المخرج بتنسيق JSON يحتوي على مفتاحين: "subject" و "body". يجب أن يكون المحتوى نصًا واحدًا، ويمكنك استخدام "\\n" للأسطر الجديدة. يجب أن يكون المحتوى جاهزًا للإرسال ومصممًا ليتوافق مع جميع برامج البريد الإلكتروني الرئيسية مثل Gmail و Outlook. استخدم خطوطًا قياسية مثل Arial أو Tahoma.
      `;
    }
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
              description: "The catchy subject line for the email."
            },
            body: {
              type: Type.STRING,
              description: "The full body content of the email, as a text string."
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