const crypto = require('crypto');
const path = require('path');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { env } = require('../config/env');
const HttpError = require('../utils/HttpError');

function isStorageConfigured() {
  return Boolean(
    env.storage.bucket && env.storage.accessKeyId && env.storage.secretAccessKey
  );
}

let s3Client = null;

function getClient() {
  if (!isStorageConfigured()) {
    throw new HttpError(503, 'El almacenamiento externo (S3/R2) no esta configurado');
  }

  if (!s3Client) {
    const config = {
      region: env.storage.region || 'auto',
      credentials: {
        accessKeyId: env.storage.accessKeyId,
        secretAccessKey: env.storage.secretAccessKey,
      },
    };

    if (env.storage.endpoint) {
      config.endpoint = env.storage.endpoint;
      config.forcePathStyle = true;
    }

    s3Client = new S3Client(config);
  }

  return s3Client;
}

function buildObjectKey(folder, originalName) {
  const ext = path.extname(originalName || '').toLowerCase() || '.bin';
  const id = crypto.randomUUID();
  return `${folder}/${id}${ext}`;
}

function buildPublicUrl(key) {
  if (env.storage.publicUrl) {
    return `${env.storage.publicUrl.replace(/\/+$/, '')}/${key}`;
  }
  if (env.storage.endpoint) {
    return `${env.storage.endpoint.replace(/\/+$/, '')}/${env.storage.bucket}/${key}`;
  }
  return `https://${env.storage.bucket}.s3.${env.storage.region}.amazonaws.com/${key}`;
}

async function uploadFile({ buffer, contentType, originalName, folder = 'uploads' }) {
  const key = buildObjectKey(folder, originalName);

  if (env.isTest) {
    return {
      key,
      url: `https://storage.test.local/${key}`,
    };
  }

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: env.storage.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: buildPublicUrl(key),
  };
}

async function deleteFile(key) {
  if (!key || env.isTest || !isStorageConfigured()) {
    return;
  }

  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.storage.bucket,
      Key: key,
    })
  );
}

async function getPresignedReadUrl(key, expiresInSeconds = 900) {
  if (env.isTest) {
    return `https://storage.test.local/${key}?signed=true`;
  }

  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: env.storage.bucket,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

module.exports = {
  isStorageConfigured,
  uploadFile,
  deleteFile,
  getPresignedReadUrl,
};
