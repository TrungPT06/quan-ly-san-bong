// Gọi API AI (Gemini hoặc OpenAI) trực tiếp từ trình duyệt.
// Cấu hình qua biến môi trường Vite: VITE_AI_PROVIDER, VITE_AI_API_KEY, VITE_AI_MODEL.
// Lưu ý: khóa API nằm trong bundle FE nên chỉ nên dùng khóa giới hạn quota/domain khi demo.
const env = import.meta.env || {};

export const AI_PROVIDER = String(env.VITE_AI_PROVIDER || "gemini").toLowerCase();
export const AI_CONFIGURED = Boolean(env.VITE_AI_API_KEY);

const DEFAULT_MODELS = { gemini: "gemini-2.5-flash", openai: "gpt-4o-mini" };

export function buildSystemPrompt(courts = []) {
  const lines = courts.slice(0, 40).map((court) => {
    const price = court.giaThapNhat != null && Number.isFinite(Number(court.giaThapNhat))
      ? `${Number(court.giaThapNhat).toLocaleString("vi-VN")}đ/giờ` : "chưa có giá";
    return `- ${court.tenSan} | cụm: ${court.tenCumSan || "chưa rõ"} | loại: ${court.loaiSan || "chưa rõ"} | giá từ: ${price} | trạng thái: ${court.trangThai || "?"}`;
  });
  return [
    "Bạn là trợ lý tư vấn của website đặt sân bóng SÂN BÓNG PRO. Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện (tối đa 5 câu).",
    "Chỉ tư vấn về sân bóng, khung giờ, giá và cách đặt sân. Nếu câu hỏi không liên quan, lịch sự từ chối và quay lại chủ đề đặt sân.",
    "Khi gợi ý sân, dùng đúng tên sân trong danh sách bên dưới. Không bịa tên sân, giá hay lịch trống; lịch trống chỉ xem được ở trang chi tiết sân.",
    "Danh sách sân hiện có:",
    lines.length ? lines.join("\n") : "(chưa có dữ liệu sân)",
  ].join("\n");
}

async function readError(response) {
  try {
    const data = await response.json();
    return data?.error?.message || data?.message || `Lỗi HTTP ${response.status}`;
  } catch {
    return `Lỗi HTTP ${response.status}`;
  }
}

async function askGemini(messages, system, signal) {
  const model = env.VITE_AI_MODEL || DEFAULT_MODELS.gemini;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.VITE_AI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })),
      generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("") || "";
  if (!text) throw new Error("AI không trả về nội dung. Hãy thử lại.");
  return text.trim();
}

async function askOpenAI(messages, system, signal) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.VITE_AI_API_KEY}` },
    body: JSON.stringify({
      model: env.VITE_AI_MODEL || DEFAULT_MODELS.openai,
      temperature: 0.6,
      max_tokens: 700,
      messages: [{ role: "system", content: system }, ...messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }))],
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("AI không trả về nội dung. Hãy thử lại.");
  return text.trim();
}

export const aiApi = {
  async chat(messages, system, signal) {
    if (!AI_CONFIGURED) throw new Error("Chưa cấu hình VITE_AI_API_KEY nên chưa thể gọi AI.");
    return AI_PROVIDER === "openai" ? askOpenAI(messages, system, signal) : askGemini(messages, system, signal);
  },
};
