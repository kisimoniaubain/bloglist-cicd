const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const { sellerOrAdmin } = require('../middleware/seller');

const isCloudinaryConfigured = () => {
  const values = [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ];

  return values.every((value) => value && !value.startsWith('your_'));
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  },
});

const mediaUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 20 },
  { name: 'media', maxCount: 20 },
  { name: 'files', maxCount: 20 },
]);

const collectUploadedFiles = (req) => {
  if (!req.files) return [];
  return ['image', 'images', 'media', 'files']
    .flatMap((field) => req.files[field] || [])
    .filter(Boolean);
};

const getStorageStatus = () => {
  const requiredEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredEnv.filter((name) => {
    const value = process.env[name];
    return !value || value.startsWith('your_');
  });

  const cloudinaryReady = isCloudinaryConfigured();

  return {
    provider: cloudinaryReady ? 'cloudinary' : 'unconfigured',
    activeMode: cloudinaryReady ? 'cloudinary' : 'unconfigured',
    ready: cloudinaryReady,
    missingVars,
  };
};

router.get('/status', (req, res) => {
  res.json({ success: true, ...getStorageStatus() });
});

router.post(
  '/',
  protect,
  sellerOrAdmin,
  mediaUpload,
  asyncHandler(async (req, res) => {
    const files = collectUploadedFiles(req);
    if (!files.length) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const uploaded = [];
    const cloudinaryConfigured = isCloudinaryConfigured();

    if (!cloudinaryConfigured) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is required for media uploads. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
    }

    for (const file of files) {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const isVideo = file.mimetype.startsWith('video/');

      const options = {
        folder: 'soldy-shop',
        resource_type: 'auto',
      };

      if (!isVideo) {
        options.transformation = [{ width: 800, quality: 'auto', fetch_format: 'auto' }];
      }

      try {
        const result = await cloudinary.uploader.upload(dataURI, options);
        uploaded.push({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type || (isVideo ? 'video' : 'image'),
          storage: 'cloudinary',
        });
      } catch (error) {
        console.error('Cloudinary upload failed:', error.message);
        return res.status(502).json({
          success: false,
          message: 'Image upload failed on Cloudinary. Please retry.',
        });
      }
    }

    return res.json({
      success: true,
      url: uploaded[0].url,
      urls: uploaded.map((item) => item.url),
      files: uploaded,
    });
  })
);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Max size is 50MB.' });
    }

    return res.status(400).json({ success: false, message: err.message });
  }

  if (err && err.message === 'Only image and video files are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }

  return next(err);
});

module.exports = router;
