import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3.js';
import path from 'path';

export const uploadFile = async (fileBuffer, originalName, mimeType) => {
  const fileExt = path.extname(originalName);
  const baseName = path.basename(originalName, fileExt);
  const keyName = `${Date.now()}-${baseName.replace(/[^a-zA-Z0-9]/g, '_')}${fileExt}`;
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
};

export const deleteFile = async (s3Key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key
  });

  await s3Client.send(command);
};

export const getFileStream = async (s3Key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key
  });

  const response = await s3Client.send(command);
  // In AWS SDK v3, Body is a stream (on Node.js it's a ReadableStream)
  return response.Body;
};
