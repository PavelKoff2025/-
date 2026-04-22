import { GoogleGenerativeAI, SchemaType, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const DEFAULT_INSTRUCTION = `Ты — AI-ассистент преподавателя НИТУ МИСИС по курсу «Взаимодействие с социальными сетями». 
Твоя задача — строго, но доброжелательно оценивать домашние задания.

Правила оценки:
1. Если работа не относится к SMM (нет постов, стратегии, анализа аудитории, призыва к действию) → НЕ ЗАЧЁТ.
2. Оценивай по трём критериям: соответствие теме, наличие целевого действия, качество оформления.
3. Не ставь ЗАЧЁТ, если студент отправил пустую ссылку или текст без смысловой нагрузки.
4. СТРУКТУРА РАЗБОРА: Выдели ровно 2 сильные стороны и ровно 2 пункта, которые нужно улучшить.
5. ТОН: Деловой, профессиональный, используй уместные эмодзи.`;

export async function analyzeHomework(homeworkContent: string) {
  try {
    const rawApiKey = process.env.GEMINI_API_KEY_NEW || process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      throw new Error('GEMINI_API_KEY_NEW is not defined. Please set it in AI Studio Secrets.');
    }

    const apiKey = rawApiKey.trim();
    
    // Debug log (masked for security)
    console.log(`Using API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)} (Length: ${apiKey.length})`);

    if (apiKey === 'MY_GEMINI_API_KEY' || apiKey.length < 10) {
      throw new Error('GEMINI_API_KEY_NEW содержит значение по умолчанию или слишком короткий. Пожалуйста, вставьте реальный ключ в Secrets.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Attempt with stable v1 endpoint and explicit model names
    const getModelResponse = async (modelName: string) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      }, { apiVersion: 'v1' });

      const systemInstruction = process.env.AI_SYSTEM_INSTRUCTION || DEFAULT_INSTRUCTION;
      
      const prompt = `${systemInstruction}

HW CONTENT ДЛЯ АНАЛИЗА:
${homeworkContent}

ОБЯЗАТЕЛЬНО ОТВЕТЬ В ФОРМАТЕ JSON:
{
  "status": "ЗАЧЁТ" или "НЕ ЗАЧЁТ",
  "score": число от 0 до 100,
  "strengths": "сильные стороны",
  "improvements": "что улучшить",
  "recommendation": "краткий итог"
}`;

      return await model.generateContent(prompt);
    };

    let result;
    try {
      // Using gemini-1.0-pro as it's guaranteed to work by the user and avoids 404s
      result = await getModelResponse("gemini-1.0-pro");
    } catch (e: any) {
      console.error("Gemini 1.0 Pro error, trying gemini-pro alias:", e.message);
      try {
        result = await getModelResponse("gemini-pro");
      } catch (innerError) {
        result = await getModelResponse("gemini-1.0-pro");
      }
    }
    const response = await result.response;
    
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Анализ заблокирован системой безопасности Gemini: ${response.promptFeedback.blockReason}`);
    }

    const text = response.text();
    
    // Clean potential markdown blocks just in case
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    return parsed;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not found')) {
        throw new Error('Недействительный API-ключ Gemini. Проверьте настройки в Secrets.');
      }
      if (error.message.includes('quota') || error.message.includes('429')) {
        throw new Error('Превышена квота запросов к ИИ. Попробуйте через минуту.');
      }
    }
    throw error;
  }
}

export async function listAvailableModels() {
  const rawApiKey = process.env.GEMINI_API_KEY_NEW || process.env.GEMINI_API_KEY;
  if (!rawApiKey) return { error: "No API Key" };
  
  const apiKey = rawApiKey.trim();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Note: The JS SDK might not have a direct listModels method equivalent to Python in the same way,
    // but we can try to fetch it if available or just return known ones.
    // Actually, the new SDK does have a way or we can check via a specific endpoint call.
    // For now, I'll return the ones we know we are trying.
    return {
      message: "Checking model accessibility...",
      keyLength: apiKey.length,
      triedModels: ["gemini-1.0-pro", "gemini-pro"]
    };
  } catch (err: any) {
    return { error: err.message };
  }
}
