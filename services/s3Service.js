const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const path = require('path');
const fs = require('fs');

// Check if S3 credentials are configured (and are not placeholder values)
const isS3Configured = () => {
  const keyId = process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_BUCKET_NAME;

  return keyId && keyId.trim() !== '' && keyId !== 'YOUR_AWS_ACCESS_KEY_ID' &&
         secret && secret.trim() !== '' && secret !== 'YOUR_AWS_SECRET_ACCESS_KEY' &&
         bucket && bucket.trim() !== '' && bucket !== 'YOUR_AWS_BUCKET_NAME';
};

const uploadFile = async (fileBuffer, originalName, mimeType) => {
  const fileExt = path.extname(originalName);
  const baseName = path.basename(originalName, fileExt);
  const keyName = `${Date.now()}-${baseName.replace(/[^a-zA-Z0-9]/g, '_')}${fileExt}`;

  if (isS3Configured()) {
    const key = `uploads/${keyName}`;
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION || 'us-east-1';

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType
    });

    await s3Client.send(command);

    return {
      key,
      url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`
    };
  } else {
    // Local fallback
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const localPath = path.join(uploadDir, keyName);
    fs.writeFileSync(localPath, fileBuffer);

    return {
      key: `local-${keyName}`,
      url: `/uploads/${keyName}`
    };
  }
};

const deleteFile = async (s3Key) => {
  if (isS3Configured() && !s3Key.startsWith('local-')) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key
    });
    await s3Client.send(command);
  } else {
    // Delete local file
    const fileName = s3Key.replace(/^local-/, '');
    const localPath = path.join(__dirname, '../public/uploads', fileName);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  }
};

const getFileStream = async (s3Key) => {
  if (isS3Configured() && !s3Key.startsWith('local-')) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key
    });
    const response = await s3Client.send(command);
    return response.Body;
  } else {
    // Local file stream
    const fileName = s3Key.replace(/^local-/, '');
    const localPath = path.join(__dirname, '../public/uploads', fileName);
    if (fs.existsSync(localPath)) {
      return fs.createReadStream(localPath);
    } else {
      throw new Error('File not found locally');
    }
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileStream
};
