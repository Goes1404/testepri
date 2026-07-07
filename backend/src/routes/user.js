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

const consentSchema = z.object({
  privacyAccepted: z.boolean(),
  marketingEmails: z.boolean().optional().default(false),
  pushNotifications: z.boolean().optional().default(false),
  incomeDataProcessing: z.boolean().optional().default(true)
});

async function audit(req, action, resource) {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: req.user?.id || null,
        action,
        resource,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || ''
      });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

// GET /api/user/profile
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    await audit(req, 'read', 'user.profile');

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
    await audit(req, 'update', 'user.profile');

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

// PUT /api/user/consents
router.put('/consents', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const consents = consentSchema.parse(req.body);
    await audit(req, 'update', 'user.consents');

    const payload = {
      consents: {
        ...consents,
        acceptedAt: new Date().toISOString(),
        version: process.env.PRIVACY_POLICY_VERSION || '2026-07-06'
      }
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .update(payload)
      .eq('user_id', userId)
      .select('user_id, consents')
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true, profile: data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid consent data', details: err.errors });
    }
    next(err);
  }
});

// GET /api/user/export - LGPD data portability
router.get('/export', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    await audit(req, 'export', 'user.data');

    const [
      user,
      profile,
      applications,
      notifications,
      alerts
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('applications').select('*, scholarships(curso_nome, programa, universities(nome, sigla))').eq('user_id', userId),
      supabase.from('notifications').select('*').eq('user_id', userId),
      supabase.from('alerts').select('*').eq('user_id', userId)
    ]);

    const errors = [user, profile, applications, notifications, alerts]
      .map(result => result.error)
      .filter(Boolean);

    if (errors.length > 0 && !user.data) {
      return res.status(500).json({ error: errors[0].message });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=portal-aluno-export-${userId}.json`);
    res.json({
      exportedAt: new Date().toISOString(),
      user: user.data || null,
      profile: profile.data || null,
      applications: applications.data || [],
      notifications: notifications.data || [],
      alerts: alerts.data || []
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/user/account - LGPD right to erasure (soft delete + scheduled purge marker)
router.delete('/account', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    await audit(req, 'delete_requested', 'user.account');
    const deletedAt = new Date();
    const purgeAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from('users')
      .update({
        deleted_at: deletedAt.toISOString(),
        purge_after: purgeAt.toISOString(),
        email: `deleted-${userId}@deleted.local`,
        nome_completo: 'Conta removida'
      })
      .eq('id', userId);

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      success: true,
      deletedAt: deletedAt.toISOString(),
      purgeAfter: purgeAt.toISOString()
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
