import Document from '../models/Document.js';
import Folder from '../models/Folder.js';
import SharedLink from '../models/SharedLink.js';
import * as s3Service from '../services/s3Service.js';

export const handleChat = async (req, res) => {
  try {
    const { message, history, documentId, shareToken } = req.body;
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
    const folders = await Folder.find({ owner: userId }).limit(5).lean();
    const documents = await Document.find({ owner: userId }).limit(5).lean();

    const folderNames = folders.map(f => f.name).join(', ');
    const docNames = documents.map(d => d.fileName).join(', ');

    const systemPrompt = `Bạn là Trợ lý học tập AI thông minh tích hợp trong hệ thống quản lý tài liệu "Cloud Study Document Manager" của sinh viên.
Nhiệm vụ của bạn là giải đáp các câu hỏi học tập, tóm tắt bài học hoặc giúp sinh viên tổ chức tài liệu học tập của họ.
Dưới đây là một số tài liệu và thư mục hiện có của sinh viên này để bạn tham khảo khi trả lời:
- Các thư mục học tập hiện có: [${folderNames || 'Chưa có thư mục nào'}]
- Các tài liệu đã tải lên gần đây: [${docNames || 'Chưa có tài liệu nào'}]

Hãy trả lời một cách CỰC KỲ ngắn gọn, súc tích, đi thẳng vào vấn đề chính. Không chào hỏi rườm rà, không giải thích dông dài để tiết kiệm tối đa token sử dụng. Định dạng câu trả lời bằng Markdown nếu cần thiết (dùng in đậm, gạch đầu dòng, vv).`;

    // Process document content context if provided and requested
    let doc = null;
    let filePart = null;
    let fileContextPrompt = "";

    if (documentId) {
      // Find document and ensure user owns it
      doc = await Document.findOne({ _id: documentId, owner: userId }).lean();
    } else if (shareToken) {
      // Find document using share token
      const sharedLink = await SharedLink.findOne({ token: shareToken }).populate('documentId').lean();
      if (sharedLink && sharedLink.documentId) {
        doc = sharedLink.documentId;
      }
    }

    if (doc) {
      // Limit to 15MB to prevent memory exhaustion
      if (doc.fileSize > 15 * 1024 * 1024) {
        fileContextPrompt = `\n[Lưu ý: Tài liệu "${doc.fileName}" quá lớn (${(doc.fileSize / (1024*1024)).toFixed(1)}MB) để AI có thể đọc trực tiếp. Vui lòng tóm tắt câu hỏi hoặc trích dẫn đoạn cần hỏi.]`;
      } else {
        const mimeType = doc.fileType;
        const isTextFile = mimeType.startsWith('text/') || 
                           ['application/json', 'application/javascript', 'application/x-javascript', 'text/javascript'].includes(mimeType) ||
                           ['.js', '.json', '.md', '.txt', '.html', '.css', '.py', '.java', '.c', '.cpp', '.h', '.sh', '.xml', '.yaml', '.yml'].some(ext => doc.fileName.toLowerCase().endsWith(ext));
        const isPdf = mimeType === 'application/pdf';
        const isImage = mimeType.startsWith('image/');

        if (isTextFile || isPdf || isImage) {
          try {
            const stream = await s3Service.getFileStream(doc.s3Key);
            const chunks = [];
            for await (const chunk of stream) {
              chunks.push(chunk);
            }
            const fileBuffer = Buffer.concat(chunks);

            if (isTextFile) {
              const fileText = fileBuffer.toString('utf-8');
              const truncatedText = fileText.slice(0, 35000); // Truncate to prevent token limit errors
              fileContextPrompt = `\n\n[DƯỚI ĐÂY LÀ NỘI DUNG TỆP TIN "${doc.fileName}"]: \n---\n${truncatedText}\n---\nHãy phân tích và trả lời các câu hỏi dựa trên nội dung tệp này.`;
            } else if (isPdf || isImage) {
              // Prepare file data in base64 format for multimodal Gemini processing
              filePart = {
                inlineData: {
                  mimeType: mimeType,
                  data: fileBuffer.toString('base64')
                }
              };
            }
          } catch (err) {
            console.error('Error fetching file for AI context:', err);
            fileContextPrompt = `\n[Lỗi: Không thể tải nội dung tệp "${doc.fileName}" từ S3]`;
          }
        } else {
          fileContextPrompt = `\n[Lưu ý: Định dạng của tệp "${doc.fileName}" (${doc.fileType}) chưa được trợ lý AI hỗ trợ đọc trực tiếp lúc này.]`;
        }
      }
    }

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

    // Append current prompt parts
    const userParts = [];
    if (filePart) {
      userParts.push({ text: `Dưới đây là tệp tin "${doc.fileName}" được đính kèm để bạn tham khảo:` });
      userParts.push(filePart);
    }
    userParts.push({ text: `${systemPrompt}${fileContextPrompt}\n\nCâu hỏi hiện tại của sinh viên: ${message}` });

    contents.push({
      role: 'user',
      parts: userParts
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          contents,
          generationConfig: {
            maxOutputTokens: 300
          }
        })
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
