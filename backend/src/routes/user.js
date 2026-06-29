const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Validation schema for profile update
const profileSchema = z.object({
  nota_enem: z.number().min(0).max(1000).optional().nullable(),
  renda_familiar: z.string().optional().nullable(),
  tipo_escola: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  cotas: z.record(z.any()).optional(),
  score_riasec: z.record(z.any()).optional(),
  cursos_interesse: z.array(z.string()).optional()
});

// GET /api/user/profile
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user public profile and profile details
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('nome_completo, email, avatar_url')
      .eq('id', userId)
      .single();

    if (userError) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { data: profileRecord, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    res.json({
      ...userRecord,
      profile: profileRecord || {}
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/profile
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const body = profileSchema.parse(req.body);

    const { data, error } = await supabase
      .from('user_profiles')
      .update(body)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: data
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: err.errors });
    }
    next(err);
  }
});

module.exports = router;
