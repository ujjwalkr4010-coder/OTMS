const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/users — Admin: list all users
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ users: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — Admin creates any user
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone, subject, bio } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required' });
    }
    if (!['student', 'tutor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{ id: userId, name, email, password: hashedPassword, role }])
      .select('id, name, email, role, created_at')
      .single();
    if (userError) throw userError;

    if (role === 'student') {
      await supabase.from('students').insert([{ user_id: userId, name, email, phone: phone || null, bio: bio || null }]);
    } else if (role === 'tutor') {
      await supabase.from('tutors').insert([{ user_id: userId, name, email, phone: phone || null, subject: subject || null, bio: bio || null }]);
    }

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — Admin edits any user
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, phone, subject, bio, password } = req.body;
    const updates = {};
    if (name)  updates.name  = name;
    if (email) updates.email = email;
    if (role)  updates.role  = role;
    if (password) updates.password = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users').update(updates).eq('id', req.params.id)
      .select('id, name, email, role').single();
    if (error) throw error;

    // Update role-specific table
    const profileUpdates = {};
    if (name)    profileUpdates.name    = name;
    if (email)   profileUpdates.email   = email;
    if (phone)   profileUpdates.phone   = phone;
    if (bio)     profileUpdates.bio     = bio;
    if (subject) profileUpdates.subject = subject;

    if (Object.keys(profileUpdates).length > 0) {
      await supabase.from('students').update(profileUpdates).eq('user_id', req.params.id);
      await supabase.from('tutors').update(profileUpdates).eq('user_id', req.params.id);
    }

    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id — Admin deletes user
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/students — list all students
router.get('/students', authenticate, authorize('admin', 'tutor'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, phone, bio, user_id, created_at');
    if (error) throw error;
    res.json({ students: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/tutors — list all tutors
router.get('/tutors', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tutors')
      .select('id, name, email, phone, subject, bio, user_id, created_at');
    if (error) throw error;
    res.json({ tutors: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/profile — own profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const table = req.user.role === 'student' ? 'students' : req.user.role === 'tutor' ? 'tutors' : null;
    if (!table) return res.json({ user: req.user });
    const { data, error } = await supabase.from(table).select('*').eq('user_id', req.user.id).single();
    if (error) throw error;
    res.json({ user: { ...req.user, profile: data } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/profile — update own profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, subject, bio, password } = req.body;
    const table = req.user.role === 'student' ? 'students' : req.user.role === 'tutor' ? 'tutors' : null;

    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (password) userUpdates.password = await bcrypt.hash(password, 12);
    if (Object.keys(userUpdates).length > 0) {
      await supabase.from('users').update(userUpdates).eq('id', req.user.id);
    }

    if (table) {
      const profileUpdates = {};
      if (name)    profileUpdates.name    = name;
      if (phone)   profileUpdates.phone   = phone;
      if (subject) profileUpdates.subject = subject;
      if (bio)     profileUpdates.bio     = bio;
      const { data, error } = await supabase.from(table).update(profileUpdates).eq('user_id', req.user.id).select().single();
      if (error) throw error;
      return res.json({ message: 'Profile updated', profile: data });
    }
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
