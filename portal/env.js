// Configuração pública de ambiente — Portal do Aluno
// Contém APENAS credenciais públicas (publishable/anon key). NUNCA colocar service role key aqui.
window.ENV_SUPABASE_URL = 'https://cryeesunxnfgkshvafbo.supabase.co';
window.ENV_SUPABASE_ANON_KEY = 'sb_publishable__ifc1Ou0s5gXCjyiaoGJYA_W6vNIMiH';

// URL pública do backend Express (Railway/Render). Enquanto não houver deploy, localhost.
window.ENV_API_URL = window.ENV_API_URL || 'http://localhost:5000';

// Config do app web Firebase (FCM) — preencher quando o projeto Firebase existir:
// window.ENV_FIREBASE_CONFIG = { apiKey: '...', projectId: '...', messagingSenderId: '...', appId: '...', vapidKey: '...' };
