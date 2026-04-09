import { GoogleGenAI } from '@google/genai';

export type AiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type DigiwellAiContext = {
  nowIso: string;
  waterIntake: number;
  waterGoal: number;
  weather?: { temp: number; status: string; location: string };
  watch?: { heartRate: number; steps: number };
  calendar?: { synced: boolean; nextEventTitle?: string };
  profile?: { nickname?: string; goal?: string; activity?: string; climate?: string };
};

type WaterAction = {
  amount: number;
  factor: number;
  name: string;
};

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
let availableGeminiModelsCache: string[] | null = null;

const PREFERRED_MODELS = [
  'models/gemini-2.5-flash',
  'models/gemini-2.5-flash-lite',
  'models/gemini-2.0-flash',
  'models/gemini-2.0-flash-lite',
  'models/gemini-flash-latest',
  'models/gemini-flash-lite-latest',
];

const FRIENDLY_FALLBACK_ADVICE = 'Hệ thống AI đang bận một chút. Tạm thời hãy uống thêm vài ngụm nước nhỏ và nghỉ 1-2 phút nhé!';

export function createGeminiClient() {
  if (!geminiApiKey) {
    throw new Error('Chưa cấu hình VITE_GEMINI_API_KEY');
  }

  return new GoogleGenAI({ apiKey: geminiApiKey });
}

export async function getGenerateContentModels(ai: GoogleGenAI) {
  if (availableGeminiModelsCache?.length) return availableGeminiModelsCache;

  try {
    const pager = await ai.models.list({ config: { pageSize: 100 } });
    const availableModels = new Set<string>();

    for await (const model of pager) {
      if (model.name && model.supportedActions?.includes('generateContent')) {
        availableModels.add(model.name);
      }
    }

    const modelsToTry = PREFERRED_MODELS.filter(modelName => availableModels.has(modelName));
    if (modelsToTry.length > 0) {
      availableGeminiModelsCache = modelsToTry;
      return modelsToTry;
    }
  } catch (error) {
    console.warn('Không thể tải danh sách Gemini models:', error);
  }

  availableGeminiModelsCache = PREFERRED_MODELS;
  return PREFERRED_MODELS;
}

export function getGeminiErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error);

  // API key bị leak hoặc bị disable
  if (
    rawMessage.includes('API key was reported as leaked') ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('status":"PERMISSION_DENIED"')
  ) {
    return 'API Key đã bị vô hiệu hóa (có thể bị leak). Hãy tạo API Key mới tại https://aistudio.google.com/apikey';
  }

  if (
    rawMessage.includes('NOT_FOUND') &&
    rawMessage.toLowerCase().includes('models/')
  ) {
    return 'Model Gemini cũ không còn hỗ trợ. Hãy thử API Key mới.';
  }

  if (
    rawMessage.includes('RESOURCE_EXHAUSTED') ||
    rawMessage.includes('"code":429') ||
    rawMessage.toLowerCase().includes('quota exceeded') ||
    rawMessage.includes('quota')
  ) {
    return 'Gemini API đã hết quota. Hãy tạo API Key mới hoặc bật billing tại https://aistudio.google.com/apikey';
  }

  if (rawMessage.includes('Chưa cấu hình VITE_GEMINI_API_KEY')) {
    return 'Chưa có API Key. Hãy tạo tại https://aistudio.google.com/apikey và thêm vào file .env';
  }

  // Lỗi network
  if (
    rawMessage.includes('fetch') ||
    rawMessage.includes('network') ||
    rawMessage.includes('ECONNREFUSED')
  ) {
    return 'Lỗi kết nối mạng. Hãy kiểm tra internet và thử lại.';
  }

  return rawMessage;
}

function buildContextSummary(context: DigiwellAiContext) {
  const now = new Date(context.nowIso);
  const timeText = Number.isNaN(now.getTime())
    ? context.nowIso
    : new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    }).format(now);

  return [
    `- Thời gian hiện tại: ${timeText}`,
    `- Lượng nước đã uống: ${context.waterIntake}/${context.waterGoal} ml`,
    context.weather
      ? `- Thời tiết: ${context.weather.temp}°C, ${context.weather.status}, tại ${context.weather.location}`
      : '- Thời tiết: chưa đồng bộ',
    context.watch
      ? `- Đồng hồ sức khỏe: ${context.watch.heartRate} BPM, ${context.watch.steps} bước`
      : '- Đồng hồ sức khỏe: chưa đồng bộ',
    context.calendar
      ? `- Lịch: ${context.calendar.synced ? `đã đồng bộ${context.calendar.nextEventTitle ? `, sự kiện gần nhất: ${context.calendar.nextEventTitle}` : ''}` : 'chưa đồng bộ'}`
      : '- Lịch: chưa đồng bộ',
    context.profile?.nickname ? `- Tên người dùng: ${context.profile.nickname}` : null,
    context.profile?.goal ? `- Mục tiêu sức khỏe: ${context.profile.goal}` : null,
    context.profile?.activity ? `- Mức vận động: ${context.profile.activity}` : null,
    context.profile?.climate ? `- Môi trường/khí hậu: ${context.profile.climate}` : null,
  ].filter(Boolean).join('\n');
}

function normalizeDrinkFactor(name: string) {
  const normalized = name.toLowerCase();

  if (
    normalized.includes('bia') ||
    normalized.includes('rượu') ||
    normalized.includes('cocktail') ||
    normalized.includes('whisky') ||
    normalized.includes('vodka')
  ) {
    return -0.5;
  }

  if (
    normalized.includes('cà phê') ||
    normalized.includes('coffee') ||
    normalized.includes('espresso') ||
    normalized.includes('trà') ||
    normalized.includes('tea')
  ) {
    return 0.8;
  }

  if (
    normalized.includes('sữa') ||
    normalized.includes('milk') ||
    normalized.includes('bù khoáng') ||
    normalized.includes('điện giải') ||
    normalized.includes('orezôn')
  ) {
    return 1.1;
  }

  return 1.0;
}

function clampWaterAction(action: Partial<WaterAction>): WaterAction | undefined {
  const amount = Math.round(Number(action.amount));
  const factor = Number(action.factor);
  const name = typeof action.name === 'string' ? action.name.trim() : '';

  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  if (!Number.isFinite(factor)) return undefined;
  if (!name) return undefined;

  return {
    amount: Math.min(Math.max(amount, 30), 2000),
    factor: Math.min(Math.max(factor, -1), 1.5),
    name: name.slice(0, 80),
  };
}

async function generateTextWithFallback(
  prompt: string,
  config?: Parameters<GoogleGenAI['models']['generateContent']>[0]['config'],
) {
  const ai = createGeminiClient();
  const modelsToTry = await getGenerateContentModels(ai);
  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
      });

      if (result.text?.trim()) {
        return result.text.trim();
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Tất cả model AI đều bị từ chối');
}

export function isAiConfigured() {
  return Boolean(geminiApiKey);
}

export async function generateHydrationAdvice(context: DigiwellAiContext): Promise<string> {
  try {
    const prompt = `Bạn là trợ lý sức khỏe AI của app DigiWell, chuyên huấn luyện uống nước thông minh.
Hãy đưa ra 1 lời khuyên thật ngắn gọn, tự nhiên, thân thiện bằng tiếng Việt, tối đa 35 chữ.
Tập trung vào hydration, nghỉ ngơi, nhịp sống hằng ngày và không chào hỏi dài dòng.
Nếu người dùng đang thiếu nhiều nước, hãy ưu tiên nhắc uống nước sớm.
Nếu người dùng gần đạt mục tiêu, hãy động viên nhẹ nhàng.
Không dùng markdown, không gạch đầu dòng.

Bối cảnh hiện tại:
${buildContextSummary(context)}

Chỉ trả về duy nhất câu khuyên.`;

    const advice = await generateTextWithFallback(prompt);
    return advice.replace(/\*/g, '').trim() || FRIENDLY_FALLBACK_ADVICE;
  } catch (error) {
    const message = getGeminiErrorMessage(error);
    if (message.includes('hết quota')) {
      return 'Gemini API đang hết quota, tạm thời hãy uống thêm nước đều trong ngày nhé!';
    }
    return FRIENDLY_FALLBACK_ADVICE;
  }
}

export async function sendAiChatMessage(
  input: string,
  context: DigiwellAiContext,
): Promise<{ reply: string; waterAction?: { amount: number; factor: number; name: string } }> {
  try {
    const prompt = `Bạn là "DigiCoach" - trợ lý sức khỏe AI thân thiện của app DigiWell.
Tên người dùng: ${context.profile?.nickname || 'Bạn'}
Thời gian: ${new Date(context.nowIso).toLocaleTimeString('vi-VN')}

QUY TẮC BẮT BUỘC:
1. Xưng hô "Mình", gọi người dùng là "${context.profile?.nickname || 'Bạn'}"
2. Trả lời cực kỳ ngắn gọn như tin nhắn người thật, kèm emoji phù hợp
3. Nếu người dùng nói uống nước/sữa/trà/cà phê/bia..., BẮT BUỘC gọi function recordWaterIntake
4. Nếu người dùng nói xóa/sửa, gọi function deleteLastWaterIntake (nếu có)
5. Tuyệt đối không tự ý cộng trừ nhân chia trong đầu

Bối cảnh:
- Đã uống: ${context.waterIntake}/${context.waterGoal}ml (Còn thiếu ${Math.max(context.waterGoal - context.waterIntake, 0)}ml)
${context.weather ? `- Thời tiết: ${context.weather.temp}°C, ${context.weather.status}` : ''}
${context.watch ? `- Vận động: ${context.watch.steps} bước, ${context.watch.heartRate} BPM` : ''}

Tin nhắn: "${input}"`;

    // @ts-ignore - Bỏ qua cảnh báo kiểu dữ liệu của Gemini Tool
    const tools = [{
      functionDeclarations: [{
        name: 'recordWaterIntake',
        description: 'Gọi hàm này bất cứ khi nào người dùng nói họ vừa uống nước, trà, cà phê, sữa, bia, rượu hoặc muốn ghi nhận lượng uống.',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            amount: {
              type: 'INTEGER' as const,
              description: 'Dung tích đồ uống tính bằng ml, ví dụ 200, 300, 500.',
            },
            factor: {
              type: 'NUMBER' as const,
              description: 'Hệ số hydration: nước/nước trái cây=1.0, cà phê/trà đậm=0.8, sữa/bù khoáng=1.1, bia/rượu/cồn=-0.5.',
            },
            name: {
              type: 'STRING' as const,
              description: 'Tên loại đồ uống, ví dụ Nước lọc, Cà phê sữa, Trà đào, Bia.',
            },
          },
          required: ['amount', 'factor', 'name'],
        },
      }],
    }] as any;

    const ai = createGeminiClient();
    const modelsToTry = await getGenerateContentModels(ai);
    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { tools },
        });

        if (result.functionCalls && result.functionCalls.length > 0) {
          const call = result.functionCalls[0];

          if (call.name === 'recordWaterIntake') {
            const args = (call.args || {}) as Partial<WaterAction>;
            const normalizedAction = clampWaterAction({
              amount: args.amount,
              factor: Number.isFinite(Number(args.factor))
                ? Number(args.factor)
                : normalizeDrinkFactor(String(args.name || '')),
              name: args.name,
            });

            if (normalizedAction) {
              const reply = normalizedAction.factor < 0
                ? `Đã hiểu, mình sẽ ghi nhận ${normalizedAction.amount}ml ${normalizedAction.name}. Loại này có thể làm giảm hydration nên nhớ bù thêm nước lọc nhé!`
                : `Đã hiểu, mình sẽ ghi nhận ${normalizedAction.amount}ml ${normalizedAction.name} cho bạn ngay nhé! 💧`;

              return {
                reply,
                waterAction: normalizedAction,
              };
            }
          }
        }

        if (result.text?.trim()) {
          return {
            reply: result.text.trim().replace(/\*/g, ''),
          };
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Không nhận được phản hồi');
  } catch (error) {
    const message = getGeminiErrorMessage(error);
    if (message.includes('API Key') || message.includes('leak') || message.includes('vô hiệu hóa')) {
      return {
        reply: `⚠️ ${message}. Vui lòng tạo API Key mới tại https://aistudio.google.com/apikey`,
      };
    }
    if (message.includes('hết quota') || message.includes('quota')) {
      return {
        reply: '⚠️ Gemini API đã hết quota. Hãy tạo API Key mới hoặc bật billing nhé!',
      };
    }
    return {
      reply: '⚠️ Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau!',
    };
  }
}

export async function scanDrinkFromImage(file: File): Promise<{ name: string; amount: number; factor: number }> {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const result = String(reader.result || '');
          const base64 = result.split(',')[1];
          if (!base64) {
            reject(new Error('Không thể đọc dữ liệu ảnh.'));
            return;
          }
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
      reader.readAsDataURL(file);
    });

    const prompt = 'Đây là hình ảnh một loại đồ uống. Hãy ước lượng tên đồ uống và dung tích gần đúng. Trả về đúng 1 dòng theo định dạng: [Tên đồ uống] - [Dung tích bằng số]ml. Ví dụ: Cà phê đen - 200ml. Nếu trong ảnh không có đồ uống hoặc không chắc chắn, hãy trả về: Lỗi - Không nhận diện được.';

    const ai = createGeminiClient();
    const modelsToTry = await getGenerateContentModels(ai);
    let responseText = '';
    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: [
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type || 'image/jpeg',
              },
            },
          ],
        });

        if (result.text?.trim()) {
          responseText = result.text.trim();
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!responseText) {
      throw lastError || new Error('Không có model nào khả dụng để phân tích ảnh!');
    }

    if (responseText.includes('Lỗi')) {
      throw new Error('Không nhận ra đồ uống trong ảnh!');
    }

    const match = responseText.match(/(.*)\s*-\s*(\d+)\s*ml/i);
    if (!match) {
      throw new Error('Không thể dự đoán dung tích!');
    }

    const name = match[1].trim();
    const amount = parseInt(match[2], 10);

    if (!name || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('Kết quả AI không hợp lệ.');
    }

    return {
      name,
      amount,
      factor: normalizeDrinkFactor(name),
    };
  } catch (error) {
    throw new Error(getGeminiErrorMessage(error) || 'Lỗi xử lý ảnh từ AI');
  }
}