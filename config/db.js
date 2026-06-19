import mongoose from 'mongoose';
import dns from 'dns';

// Cấu hình Google DNS để tránh lỗi chặn kết nối MongoDB Atlas SRV
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudstudy');
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

export default connectDB;
