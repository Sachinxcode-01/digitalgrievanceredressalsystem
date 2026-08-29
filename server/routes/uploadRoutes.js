const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/authMiddleware');
const { fileSignatureMiddleware, sanitizeFileName } = require('../utils/fileSignatureValidator');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file type. Allowed: Images, PDF, Word documents, Plain text.');
      err.status = 400;
      cb(err);
    }
  }
});

// @route   POST /api/v1/uploads
// @desc    Upload file attachment to Supabase Storage bucket 'attachments' with magic byte validation
router.post('/', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 5MB limit.' });
      }
      return res.status(err.status || 400).json({ error: err.message });
    }
    next();
  });
}, fileSignatureMiddleware, async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided in request payload.' });
    }

    const userId = req.user?.id || 'anon';
    const rawName = file.sanitizedOriginalName || sanitizeFileName(file.originalname);
    const fileExt = path.extname(rawName).replace('.', '') || file.mimetype.split('/')[1] || 'bin';
    const fileName = `attach_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `user_${userId}/${fileName}`;

    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (!uploadError) {
          const { data } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

          return res.json({
            publicUrl: data.publicUrl,
            filePath,
            name: rawName,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      } catch (err) {
        console.warn('[Upload DB Storage fallback]:', err.message);
      }
    }

    // Fallback data URI for local test environments
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;

    res.json({
      publicUrl: dataUrl,
      filePath: `local/${fileName}`,
      name: rawName,
      size: file.size,
      mimetype: file.mimetype
    });
  } catch (err) {
    next(err);
  }
});

const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for avatars
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Invalid avatar file type. Allowed formats: JPEG, PNG, WebP, GIF.');
      err.status = 400;
      cb(err);
    }
  }
});

// @route   POST /api/v1/uploads/profile-image
// @desc    Upload user profile image avatar to Supabase Storage with magic byte validation
router.post('/profile-image', authenticateToken, (req, res, next) => {
  avatarUpload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Avatar image size exceeds 2MB limit.' });
      }
      return res.status(err.status || 400).json({ error: err.message });
    }
    next();
  });
}, fileSignatureMiddleware, async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No avatar file provided.' });

    const userId = req.user?.id || 'anon';
    const rawName = file.sanitizedOriginalName || sanitizeFileName(file.originalname);
    const fileExt = path.extname(rawName).replace('.', '') || 'jpg';
    const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
          return res.json({ publicUrl: data.publicUrl, filePath, name: rawName });
        }
      } catch (err) {
        console.warn('[Avatar upload fallback]:', err.message);
      }
    }

    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    res.json({ publicUrl: dataUrl, filePath, name: rawName });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
