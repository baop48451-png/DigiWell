import { useState, useCallback, useRef } from 'react';
import { createGeminiClient, generateHydrationAdvice, getGenerateContentModels } from '../lib/ai';
import { useAuthStore } from '../store/useAuthStore';
import { useHealthStore } from '../store/useHealthStore';
import { useHydrationStore } from '../store/useHydrationStore';
import { useUIStore } from '../store/useUIStore';
import { useHydrationLogic } from './useHydrationLogic';
import { toast } from 'sonner';
import { LocalNotifications } from '@capacitor/local-notifications';

export function useAiLogic() {
  const { profile } = useAuthStore();
  const { weatherData, isWeatherSynced, watchData, isWatchConnected, calendarEvents, isCalendarSynced } = useHealthStore();
  const { waterIntake, setWaterIntake, waterEntries, setWaterEntries } = useHydrationStore();
  const { setActiveTab, setShowAiChat } = useUIStore();
  const { handleAddWater, handleDeleteEntry } = useHydrationLogic();
  
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const analyzeAndNudge = useCallback(async () => {
    if (!profile?.id) return;

    let nudgeMessage = '';
    
    if (isWeatherSynced && weatherData.temp > 32 && waterIntake < 1000) {
      nudgeMessage = `Trời đang rất nóng (${weatherData.temp}°C), đừng quên uống nước để làm mát cơ thể nhé ${profile.nickname}! ☀️💧`;
    } else if (isWatchConnected && watchData.steps > 5000 && waterIntake < 1500) {
      nudgeMessage = `Bạn đã đi được ${watchData.steps} bước rồi, cơ thể cần bù nước ngay thôi ${profile.nickname}! 🏃‍♂️💧`;
    } else if (isCalendarSynced && calendarEvents.length > 0 && waterIntake < 1000) {
      nudgeMessage = `Sắp đến giờ ${calendarEvents[0].title}, uống một ly nước để tỉnh táo hơn nhé ${profile.nickname}! 📅💧`;
    }

    if (nudgeMessage) {
      await LocalNotifications.schedule({
        notifications: [{
          title: 'DigiCoach nhắc nhở 🤖',
          body: nudgeMessage,
          id: 100,
          schedule: { at: new Date(Date.now() + 1000) }
        }]
      });
    }
  }, [profile, isWeatherSynced, weatherData, waterIntake, isWatchConnected, watchData, isCalendarSynced, calendarEvents]);

  const fetchAIAdvice = useCallback(async (mood?: string, meal?: string) => {
    setIsAiLoading(true);
    try {
      const context = {
        nowIso: new Date().toISOString(),
        waterIntake,
        waterGoal: 2000, 
        weather: isWeatherSynced ? weatherData : undefined,
        watch: isWatchConnected ? watchData : undefined,
        calendar: { synced: isCalendarSynced, nextEventTitle: calendarEvents[0]?.title },
        profile,
        mood,
        meal
      };
      const advice = await generateHydrationAdvice(context);
      setAiAdvice(advice);
    } catch (error) {
      setAiAdvice("Hệ thống AI đang bảo trì, vui lòng uống đủ nước bạn nhé!");
    } finally {
      setIsAiLoading(false);
    }
  }, [waterIntake, isWeatherSynced, weatherData, isWatchConnected, watchData, isCalendarSynced, calendarEvents, profile]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const getSystemPrompt = () => {
        const historyText = waterEntries.length > 0 
          ? `Lịch sử uống nước hôm nay:\\n` + waterEntries.map(e => `- ${new Date(e.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}: ${e.actual_ml || e.amount}ml ${e.name}`).join('\\n')
          : 'Chưa có ghi nhận nào.';

        const weatherStr = isWeatherSynced ? `\\n- Thời tiết hiện tại: ${weatherData.temp}°C, ${weatherData.status}` : '';
        const watchStr = isWatchConnected ? `\\n- Tình trạng vận động: ${watchData.steps} bước, nhịp tim ${watchData.heartRate} BPM` : '';

        return `Bạn là "DigiCoach" - một chuyên gia sức khỏe AI thân thiện, vui tính và cực kỳ thông minh của ứng dụng DigiWell.
Tên người dùng: ${profile?.nickname || 'Bạn'}
Thời gian thực: ${new Date().toLocaleTimeString('vi-VN')}

Nhiệm vụ & Kỷ luật thép (BẮT BUỘC TUÂN THỦ):
1. Luôn xưng hô "Mình", gọi người dùng là "${profile?.nickname || 'Bạn'}". Trả lời siêu ngắn gọn như tin nhắn người thật, kèm emoji.
2. TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ CỘNG NHẨM TRONG ĐẦU. Khi người dùng báo vừa uống nước/sữa/trà/bia..., BẮT BUỘC gọi Tool 'recordWaterIntake' để ghi nhận vào app.
3. BẮT BUỘC gọi Tool 'deleteLastWaterIntake' nếu người dùng nói lỡ nhập sai hoặc muốn xóa ly nước vừa nãy.
4. Nếu gọi Tool, hệ thống sẽ trả về kết quả. Đọc kết quả đó và phản hồi lại bằng văn bản 1 cách tự nhiên nhất.

Chỉ số sức khỏe hiện tại của người dùng:
- Đã uống: ${waterIntake}/2000 ml (Còn thiếu ${Math.max(2000 - waterIntake, 0)} ml)${weatherStr}${watchStr}

${historyText}`;
      };

      const recentMessages = chatMessages.slice(-10);
      const conversation: any[] = recentMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      conversation.push({ role: 'user', parts: [{ text: userMsg }] });

      const ai = createGeminiClient();
      const modelsToTry = await getGenerateContentModels(ai);
      let advice = "";

      const tools = [{
        functionDeclarations: [{
          name: 'recordWaterIntake',
          description: 'BẮT BUỘC GỌI HÀM NÀY khi người dùng nói họ vừa uống bất kỳ loại đồ uống nào (nước, trà, sữa, cà phê, bia...). Công cụ sẽ tự động xử lý và cộng vào hệ thống.',
          parameters: {
            type: 'OBJECT' as any,
            properties: {
              amount: { type: 'INTEGER' as any, description: 'Dung tích tính bằng ml (vd: 200, 300)' },
              factor: { type: 'NUMBER' as any, description: 'Hệ số: Nước/Nước trái cây=1.0, Cà phê/Trà=0.8, Sữa=1.1, Cồn=-0.5' },
              name: { type: 'STRING' as any, description: 'Tên loại đồ uống (vd: Nước lọc, Cà phê, Bia)' }
            },
            required: ['amount', 'factor', 'name']
          }
        }]
      }, {
        functionDeclarations: [{
          name: 'navigateTab',
          description: 'Mở các thẻ (tab) chức năng của ứng dụng (Trang chủ, Thống kê, Bảng xếp hạng, Cộng đồng, Hồ sơ).',
          parameters: {
            type: 'OBJECT' as any,
            properties: {
              tabName: { type: 'STRING' as any, description: 'Chỉ định 1 trong: "home", "insight", "league", "feed", "profile"' }
            },
            required: ['tabName']
          }
        }]
      }, {
        functionDeclarations: [{
          name: 'deleteLastWaterIntake',
          description: 'Hủy hoặc xóa lần ghi nhận nước uống gần nhất trong ngày khi người dùng nói họ nhập nhầm, nhập sai, hoặc bảo xóa bớt đi.',
          parameters: {
            type: 'OBJECT' as any,
            properties: {
              reason: { type: 'STRING' as any, description: 'Lý do xóa' }
            }
          }
        }]
      }, {
        functionDeclarations: [{
          name: 'triggerSystemAction',
          description: 'Thực hiện các hành động hệ thống như: "export_pdf" (xuất báo cáo y khoa PDF), "toggle_fasting" (bật/tắt nhịn ăn), "open_history" (mở lịch sử).',
          parameters: {
            type: 'OBJECT' as any,
            properties: {
              action: { type: 'STRING' as any, description: 'Các hành động hỗ trợ: "export_pdf", "toggle_fasting", "open_history"' }
            },
            required: ['action']
          }
        }]
      }] as any;

      for (const modelName of modelsToTry) {
        try {
          const currentConversation = [...conversation];
          let loopCount = 0;
          let isDone = false;

          while (loopCount < 3 && !isDone) {
            loopCount++;
            const result = await ai.models.generateContent({ 
              model: modelName, 
              contents: currentConversation,
              config: { 
                systemInstruction: getSystemPrompt(),
                tools: tools 
              }
            });
            
            if (result.functionCalls && result.functionCalls.length > 0) {
              const call = result.functionCalls[0];
              let functionResult: any = {};

              if (call.name === 'recordWaterIntake') {
                const { amount, factor, name } = call.args as any;
                await handleAddWater(amount, factor, name);
                functionResult = { success: true, message: `Đã cộng ${amount}ml (${name}).` };
              } else if (call.name === 'deleteLastWaterIntake') {
                if (waterEntries.length > 0) {
                  const lastEntry = waterEntries[waterEntries.length - 1];
                  await handleDeleteEntry(lastEntry.id);
                  functionResult = { success: true, message: `Đã xóa ${lastEntry.actual_ml || lastEntry.amount}ml gần nhất.` };
                } else {
                  functionResult = { success: false, message: `Không có dữ liệu nước nào hôm nay để xóa.` };
                }
              } else if (call.name === 'navigateTab') {
                const { tabName } = call.args as any;
                setActiveTab(tabName as any);
                setTimeout(() => setShowAiChat(false), 1500);
                functionResult = { success: true, message: `Đã chuyển đến trang ${tabName}` };
              } else if (call.name === 'triggerSystemAction') {
                const { action } = call.args as any;
                functionResult = { success: true, message: `Đã thực hiện ${action}.` };
              }

              currentConversation.push({ role: 'model', parts: [{ functionCall: call }] });
              currentConversation.push({ role: 'user', parts: [{ functionResponse: { name: call.name, response: functionResult } }] });
            } else if (result.text) { 
              advice = result.text; 
              isDone = true; 
            } else {
              isDone = true;
            }
          }
          if (advice) break;
        } catch (err) {
          console.error('AI Model Error:', err);
        }
      }
      
      if (advice) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: advice }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Mình không biết trả lời câu này, bạn thử lại nhé! 😅' }]);
      }
    } catch (error) {
      console.error("Chat AI Error:", error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Có lỗi xảy ra, bạn hãy thử lại sau nhé! 😢' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const analyzeCorrelation = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const insights = await generateHydrationAdvice({
        profile,
        waterIntake,
        isWatchConnected,
        watchData,
        isCalendarSynced,
        calendarEvents,
        isWeatherSynced,
        weatherData,
        nowIso: new Date().toISOString()
      });
      setAiAdvice(`Phân tích xu hướng: ${insights}`);
    } catch (error) {
      console.error('Correlation error:', error);
    }
  }, [profile, waterIntake, isWatchConnected, watchData, isCalendarSynced, calendarEvents, isWeatherSynced, weatherData]);

  return {
    aiAdvice,
    setAiAdvice,
    isAiLoading,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    isChatLoading,
    fetchAIAdvice,
    handleSendChatMessage,
    analyzeAndNudge,
    analyzeCorrelation
  };
}
