
import { GoogleGenAI } from "@google/genai";
import { Employee } from "../types";

export const generateCongratulation = async (employee: Employee, prizeName: string): Promise<string> => {
  try {
    // Fix: Use process.env.API_KEY directly in initialization as required by guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for fast responses
    const model = 'gemini-3-flash-preview'; 

    const employeeDetails = `
      - Tên: ${employee.name}
      - Email: ${employee.email}
      ${employee.department ? `- Phòng ban: ${employee.department}` : ''}
    `;

    const prompt = `
      Nhiệm vụ: Viết một lời chúc mừng trúng thưởng cực kỳ sôi động, hài hước và cá nhân hóa cho nhân viên trong buổi tiệc tất niên (Year End Party).
      
      Thông tin nhân viên:
      ${employeeDetails}
      Giải thưởng nhận được: ${prizeName}
      
      Yêu cầu:
      - Tận dụng thông tin về tên hoặc phòng ban để chơi chữ hoặc tạo sự thân mật (ví dụ: "IT mà trúng giải này thì code chạy phăm phăm").
      - Giọng văn: Bùng nổ, vui vẻ, thân thiện.
      - Độ dài: Tối đa 2 câu.
      - Nếu là Giải Đặc Biệt hoặc Giải Nhất, hãy nâng tầm sự hào hứng lên mức cao nhất.
      - Chỉ trả về nội dung lời chúc, không thêm bất kỳ văn bản giải thích nào.
    `;

    // Fix: Call generateContent directly on ai.models
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    // Fix: Use response.text property (not a method call) as per guidelines
    return response.text?.trim() || `Chúc mừng ${employee.name} đã trúng ${prizeName}!`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Chúc mừng ${employee.name} đã trúng ${prizeName}!`;
  }
};
