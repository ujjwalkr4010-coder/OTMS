const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Use memory storage — we stream directly to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Use PDF, Word, image, or text files.'));
    }
  }
});

// POST /api/upload/assignment — upload file for assignment submission
router.post('/assignment', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const ext = req.file.originalname.split('.').pop();
    const fileName = `assignments/${req.user.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('otms-files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('otms-files')
      .getPublicUrl(fileName);

    res.json({
      message: 'File uploaded successfully',
      file_url: urlData.publicUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload/profile — upload profile picture
router.post('/profile', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const ext = req.file.originalname.split('.').pop();
    const fileName = `profiles/${req.user.id}.${ext}`;

    const { error } = await supabase.storage
      .from('otms-files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true // overwrite existing profile pic
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('otms-files')
      .getPublicUrl(fileName);

    // Save URL to user profile
    const table = req.user.role === 'student' ? 'students' : req.user.role === 'tutor' ? 'tutors' : null;
    if (table) {
      await supabase.from(table).update({ avatar_url: urlData.publicUrl }).eq('user_id', req.user.id);
    }

    res.json({ message: 'Profile picture uploaded', avatar_url: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
