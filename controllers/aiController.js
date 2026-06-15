import Document from '../models/Document.js';
import Folder from '../models/Folder.js';

export const handleChat = async (req, res) => {
  try {
    const { message, history } = req.body;
    const userId = req.session.userId;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
      return res.status(400).json({ 
        reply: 'Trợ lý AI chưa được cấu hình khóa API (GEMINI_API_KEY) trong file .env. Vui lòng liên hệ quản trị viên!' 
      });
    }

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Tin nhắn không được để trống' });
    }

    // Context preparation: load some of user's files and folders to make the AI smart about their docs!
    const folders = await Folder.find({ owner: userId }).limit(10).lean();
    const documents = await Document.find({ owner: userId }).limit(10).lean();

    const folderNames = folders.map(f => f.name).join(', ');
    const docNames = documents.map(d => d.fileName).join(', ');

    const systemPrompt = `Bạn là Trợ lý học tập AI thông minh tích hợp trong hệ thống quản lý tài liệu "Cloud Study Document Manager" của sinh viên.
Nhiệm vụ của bạn là giải đáp các câu hỏi học tập, tóm tắt bài học hoặc giúp sinh viên tổ chức tài liệu học tập của họ.
Dưới đây là một số tài liệu và thư mục hiện có của sinh viên này để bạn tham khảo khi trả lời:
- Các thư mục học tập hiện có: [${folderNames || 'Chưa có thư mục nào'}]
- Các tài liệu đã tải lên gần đây: [${docNames || 'Chưa có tài liệu nào'}]

Hãy trả lời một cách thân thiện, hữu ích, xúc tích bằng tiếng Việt. Định dạng câu trả lời bằng Markdown nếu cần thiết (dùng in đậm, gạch đầu dòng, etc).`;

    // Construct request payload matching Google Gemini API format
    const contents = [];
    
    // Add system context and chat history if any
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Append current prompt
    contents.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nCâu hỏi hiện tại của sinh viên: ${message}` }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return res.status(500).json({ 
        reply: 'Rất tiếc, tôi gặp sự cố khi kết nối tới máy chủ trí tuệ nhân tạo. Vui lòng thử lại sau!' 
      });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tôi không nhận được phản hồi phù hợp từ AI.';

    res.json({ reply });
  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ reply: 'Đã xảy ra lỗi hệ thống khi xử lý câu hỏi của bạn.' });
  }
};
