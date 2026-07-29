
import { GoogleGenAI } from "@google/genai";
import { Employee } from "../types";

export const generateCongratulation = async (employee: Employee, prizeName: string, lang: 'vi' | 'en' | 'mm' = 'mm'): Promise<string> => {
  let defaultMessage = `Chúc mừng ${employee.name} đã may mắn trúng giải ${prizeName}! Chúc bạn gặt hái thêm nhiều thành công mới cùng công ty! 🎉`;
  if (lang === 'en') {
    defaultMessage = `Congratulations to ${employee.name} on winning the ${prizeName}! Wishing you a wonderful year ahead! 🎉`;
  } else if (lang === 'mm') {
    defaultMessage = `${prizeName} ဆုကို ဆွတ်ခူးရရှိသွားသော ${employee.name} အား အထူးပင် ဂုဏ်ယူဝမ်းမြောက်ပါသည်! ပိုမိုအောင်မြင်သော နှစ်သစ်ဖြစ်ပါစေ! 🎉`;
  }
  
  try {
    const apiKey = process.env.API_KEY || "";
    if (!apiKey) {
      return defaultMessage;
    }
    
    // Fix: Use process.env.API_KEY directly in initialization as required by guidelines
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3-flash-preview for fast responses
    const model = 'gemini-3-flash-preview'; 

    const employeeDetails = `
      - Tên: ${employee.name}
      - Email: ${employee.email}
      ${employee.department ? `- Phòng ban: ${employee.department}` : ''}
    `;

    const prompt = `
      Nhiệm vụ: Viết một lời chúc mừng trúng thưởng cực kỳ sôi động, hài hước và cá nhân hóa cho nhân viên trong buổi tiệc bốc thăm may mắn.
      
      Thông tin người trúng giải:
      ${employeeDetails}
      Giải thưởng nhận được: ${prizeName}
      
      Yêu cầu:
      - Ngôn ngữ viết lời chúc: ${lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'English' : 'မြန်မာဘာသာ (Myanmar/Burmese)'}. Hãy viết hoàn toàn bằng ngôn ngữ này.
      - Nếu tên là một mã số dự thưởng hoặc một chữ số (Ví dụ: 12, 345, SBD-102), hãy chúc mừng chủ nhân của con số may mắn này bằng giọng điệu hân hoan, tràn đầy tài lộc.
      - Nếu là tên người cụ thể, hãy tạo sự thân mật, vui tươi.
      - Giọng văn: Bùng nổ, vui vẻ, thân thiện.
      - Độ dài: Tối đa 2 câu.
      - Nếu là Giải Đặc Biệt hoặc Giải Nhất, hãy nâng tầm sự hào hứng lên mức cao nhất.
      - Chỉ trả về nội dung lời chúc, không thêm bất kỳ văn bản giải thích nào.
    `;

    // Implement a 5-second timeout for the API call
    const apiCall = ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    const response = await Promise.race([apiCall, timeoutPromise]);

    // Fix: Use response.text property (not a method call) as per guidelines
    return response.text?.trim() || defaultMessage;
  } catch (error) {
    console.error("Gemini API Error or Timeout:", error);
    return defaultMessage;
  }
};
