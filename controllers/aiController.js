import * as aiService from '../services/aiService.js';

export const handleChat = async (req, res) => {
  try {
    const { message, history, documentId } = req.body;
    const userId = req.session.userId;
    const apiKey = process.env.GEMINI_API_KEY;

    const reply = await aiService.processChat(
      message, 
      history, 
      documentId, 
      userId, 
      apiKey
    );

    res.json({ reply });
  } catch (error) {
    console.error('[AI Controller] Error in handleChat:', error);
    res.json({ 
      reply: error.message || 'Đã xảy ra lỗi hệ thống khi xử lý câu hỏi của bạn.' 
    });
  }
};
