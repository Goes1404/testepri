-- ============================================================================
-- PORTAL DO ALUNO — PROVISIONAMENTO COMPLETO DE PRODUÇÃO (arquivo único)
-- Projeto: cryeesunxnfgkshvafbo
-- Como usar: Supabase Dashboard → SQL Editor → New query → colar TUDO → Run.
-- Executar UMA VEZ em banco vazio. (upgrade_producao.sql é idempotente e pode
-- ser reexecutado sozinho no futuro.)
-- ============================================================================

-- ═══════════════ 1/4: schema.sql ═══════════════
-- Database Schema for Portal do Aluno (Supabase / PostgreSQL)

-- ═══════════════════════════════════════════════════════════════
-- 1. CLEANUP & EXTENSIONS
-- ═══════════════════════════════════════════════════════════════
create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- 2. TABLES DEFINITIONS
-- ═══════════════════════════════════════════════════════════════

-- Users table (linked to Supabase Auth)
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    nome_completo text,
    avatar_url text,
    deleted_at timestamp with time zone,
    purge_after timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Profiles table (user context data)
create table public.user_profiles (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null unique,
    nota_enem integer,
    renda_familiar text,
    tipo_escola text,
    cidade text,
    estado text,
    cotas jsonb default '{}'::jsonb,
    score_riasec jsonb default '{}'::jsonb,
    cursos_interesse text[] default '{}'::text[],
    consents jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Universities table
create table public.universities (
    id bigserial primary key,
    codigo_mec integer unique not null,
    nome text not null,
    sigla text not null,
    tipo text not null, -- Publica, Privada
    estados text[] default '{}'::text[],
    ranking_mec numeric,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scholarships table
create table public.scholarships (
    id bigserial primary key,
    university_id bigint references public.universities(id) on delete cascade not null,
    curso_nome text not null,
    programa text not null, -- ProUni, SISU, FIES, Particular
    percentual numeric not null, -- e.g., 100.00 for integral, 50.00 for parcial, 0 for SISU
    valor_mensalidade numeric not null,
    nota_corte numeric not null,
    vagas_total integer not null,
    vagas_disponiveis integer not null,
    renda_maxima text,
    cotas text[] default '{}'::text[],
    prazo_inscricao timestamp with time zone,
    ativo boolean default true not null,
    last_sync timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cut Score History
create table public.cut_score_history (
    id bigserial primary key,
    scholarship_id bigint references public.scholarships(id) on delete cascade not null,
    ano integer not null,
    nota_min numeric not null,
    nota_max numeric not null,
    nota_media numeric not null
);

-- Applications table
create table public.applications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    scholarship_id bigint references public.scholarships(id) on delete cascade not null,
    status text default 'Inscrito'::text not null, -- Inscrito, Em Analise, Documentos Pendentes, Aprovado, Reprovado
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents table
create table public.documents (
    id uuid default gen_random_uuid() primary key,
    application_id uuid references public.applications(id) on delete cascade not null,
    tipo text not null, -- RG, CPF, Historico Escolar, Comprovante de Renda, ENEM, etc.
    status text default 'pending'::text not null, -- pending, approved, rejected, ai
    file_url text,
    metadata jsonb default '{}'::jsonb,
    uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications table
create table public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    tipo text not null, -- Prazo, Candidatura, Alerta, Documento
    titulo text not null,
    corpo text not null,
    read_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Audit logs for PII access and LGPD-sensitive actions
create table public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete set null,
    action text not null,
    resource text not null,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alerts table
create table public.alerts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    criterios jsonb not null, -- { curso: text, cidade: text, minPct: number }
    canal text default 'email'::text not null, -- email, push, ambos
    ativo boolean default true not null,
    ultima_notificacao timestamp with time zone
);

-- Deadlines table
create table public.deadlines (
    id bigserial primary key,
    programa text not null, -- ProUni, SISU, FIES
    descricao text not null,
    data_limite timestamp with time zone not null,
    source_url text
);

-- Events table
create table public.events (
    id bigserial primary key,
    titulo text not null,
    universidade_id bigint references public.universities(id) on delete cascade not null,
    data timestamp with time zone not null,
    vagas integer not null,
    cidade text not null,
    estado text not null
);

-- NPS beta responses (Roadmap Final - Fase 4, item 7)
create table public.nps_responses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete set null,
    score integer not null check (score >= 0 and score <= 10),
    comentario text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.nps_responses enable row level security;

create policy "Users can insert own nps response" on public.nps_responses
    for insert with check (auth.uid() = user_id);

create policy "Users can read own nps response" on public.nps_responses
    for select using (auth.uid() = user_id);

-- Row Level Security baseline
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.alerts enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can read own user row" on public.users
    for select using (auth.uid() = id);

create policy "Users can update own user row" on public.users
    for update using (auth.uid() = id);

create policy "Users can manage own profile" on public.user_profiles
    for all using (auth.uid() = user_id);

create policy "Users can manage own applications" on public.applications
    for all using (auth.uid() = user_id);

create policy "Users can manage own documents" on public.documents
    for all using (
        exists (
            select 1 from public.applications a
            where a.id = documents.application_id
            and a.user_id = auth.uid()
        )
    );

create policy "Users can manage own notifications" on public.notifications
    for all using (auth.uid() = user_id);

create policy "Users can manage own alerts" on public.alerts
    for all using (auth.uid() = user_id);

create policy "Users can read own audit logs" on public.audit_logs
    for select using (auth.uid() = user_id);

-- Event Registrations table
create table public.event_registrations (
    id uuid default gen_random_uuid() primary key,
    event_id bigint references public.events(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(event_id, user_id)
);

-- Community Posts
create table public.community_posts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    tipo text not null, -- historia, duvida
    titulo text not null,
    corpo text not null,
    aprovado boolean default false not null,
    likes integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Community Answers
create table public.community_answers (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references public.community_posts(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete cascade not null,
    corpo text not null,
    votos integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Achievements
create table public.achievements (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    tipo text not null, -- Primeira Candidatura, Perfil Completo, etc.
    desbloqueado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activity Log
create table public.activity_log (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    tipo text not null,
    dados jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vocational Results
create table public.vocational_results (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    score_riasec jsonb not null,
    areas_recomendadas text[] default '{}'::text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quiz Sessions
create table public.quiz_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    tipo text not null, -- vestibular, vocacional
    respostas jsonb not null,
    score numeric not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ═══════════════════════════════════════════════════════════════
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_answers enable row level security;
alter table public.achievements enable row level security;
alter table public.activity_log enable row level security;
alter table public.vocational_results enable row level security;
alter table public.quiz_sessions enable row level security;

create policy "Public can read events" on public.events
    for select using (true);

create policy "Users can manage own event registrations" on public.event_registrations
    for all using (auth.uid() = user_id);

create policy "Public can read approved community posts" on public.community_posts
    for select using (aprovado = true or auth.uid() = user_id);

create policy "Users can create own community posts" on public.community_posts
    for insert with check (auth.uid() = user_id);

create policy "Public can read community answers" on public.community_answers
    for select using (true);

create policy "Users can create own community answers" on public.community_answers
    for insert with check (auth.uid() = user_id);

create policy "Users can manage own achievements" on public.achievements
    for all using (auth.uid() = user_id);

create policy "Users can manage own activity log" on public.activity_log
    for all using (auth.uid() = user_id);

create policy "Users can manage own vocational results" on public.vocational_results
    for all using (auth.uid() = user_id);

create policy "Users can manage own quiz sessions" on public.quiz_sessions
    for all using (auth.uid() = user_id);

-- 3. TRIGGERS & FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Handle New User Creation Trigger Function
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, nome_completo, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'nome_completo', new.raw_user_meta_data->>'name', ''),
        coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
    );
    
    -- Auto-initialize empty user profile
    insert into public.user_profiles (user_id)
    values (new.id);
    
    return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.universities enable row level security;
alter table public.scholarships enable row level security;
alter table public.cut_score_history enable row level security;
alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.alerts enable row level security;
alter table public.deadlines enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_answers enable row level security;
alter table public.achievements enable row level security;
alter table public.activity_log enable row level security;
alter table public.vocational_results enable row level security;
alter table public.quiz_sessions enable row level security;

-- public.users Policies
create policy "Users can view their own data." on public.users
    for select using (auth.uid() = id);
create policy "Users can update their own data." on public.users
    for update using (auth.uid() = id);

-- public.user_profiles Policies
create policy "Users can view their own profile." on public.user_profiles
    for select using (auth.uid() = user_id);
create policy "Users can update their own profile." on public.user_profiles
    for update using (auth.uid() = user_id);

-- Static/Public Info Policies (Universities, Scholarships, CutScoreHistory, Deadlines, Events)
create policy "Anyone can view universities." on public.universities for select using (true);
create policy "Anyone can view scholarships." on public.scholarships for select using (true);
create policy "Anyone can view cut score histories." on public.cut_score_history for select using (true);
create policy "Anyone can view deadlines." on public.deadlines for select using (true);
create policy "Anyone can view events." on public.events for select using (true);

-- public.applications Policies
create policy "Users can view their own applications." on public.applications
    for select using (auth.uid() = user_id);
create policy "Users can create their own applications." on public.applications
    for insert with check (auth.uid() = user_id);
create policy "Users can update their own applications." on public.applications
    for update using (auth.uid() = user_id);

-- public.documents Policies
create policy "Users can view their own documents." on public.documents
    for select using (
        exists (
            select 1 from public.applications
            where public.applications.id = application_id and public.applications.user_id = auth.uid()
        )
    );
create policy "Users can upload their own documents." on public.documents
    for insert with check (
        exists (
            select 1 from public.applications
            where public.applications.id = application_id and public.applications.user_id = auth.uid()
        )
    );
create policy "Users can edit their own documents." on public.documents
    for update using (
        exists (
            select 1 from public.applications
            where public.applications.id = application_id and public.applications.user_id = auth.uid()
        )
    );

-- public.notifications Policies
create policy "Users can view their own notifications." on public.notifications
    for select using (auth.uid() = user_id);
create policy "Users can update their own notifications." on public.notifications
    for update using (auth.uid() = user_id);

-- public.alerts Policies
create policy "Users can view their own alerts." on public.alerts
    for select using (auth.uid() = user_id);
create policy "Users can manage their own alerts." on public.alerts
    for all using (auth.uid() = user_id);

-- public.event_registrations Policies
create policy "Users can view their own registrations." on public.event_registrations
    for select using (auth.uid() = user_id);
create policy "Users can register to events." on public.event_registrations
    for insert with check (auth.uid() = user_id);
create policy "Users can cancel event registration." on public.event_registrations
    for delete using (auth.uid() = user_id);

-- Community posts/answers Policies
create policy "Anyone can view approved posts." on public.community_posts
    for select using (aprovado = true);
create policy "Author can view their unapproved posts." on public.community_posts
    for select using (auth.uid() = user_id);
create policy "Authenticated users can create posts." on public.community_posts
    for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);
create policy "Author can edit/delete their own posts." on public.community_posts
    for update using (auth.uid() = user_id);

create policy "Anyone can view community answers." on public.community_answers
    for select using (true);
create policy "Authenticated users can post answers." on public.community_answers
    for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);
create policy "Author can edit/delete their answers." on public.community_answers
    for update using (auth.uid() = user_id);

-- public.achievements Policies
create policy "Users can view their achievements." on public.achievements
    for select using (auth.uid() = user_id);

-- public.activity_log Policies
create policy "Users can view their activity logs." on public.activity_log
    for select using (auth.uid() = user_id);
create policy "Users can insert activity logs." on public.activity_log
    for insert with check (auth.uid() = user_id);

-- public.vocational_results Policies
create policy "Users can view their vocational results." on public.vocational_results
    for select using (auth.uid() = user_id);
create policy "Users can save vocational results." on public.vocational_results
    for insert with check (auth.uid() = user_id);

-- public.quiz_sessions Policies
create policy "Users can view their quiz sessions." on public.quiz_sessions
    for select using (auth.uid() = user_id);
create policy "Users can save quiz sessions." on public.quiz_sessions
    for insert with check (auth.uid() = user_id);

-- ═══════════════ 2/4: seed.sql ═══════════════
-- Seed initial data for Portal do Aluno

-- ═══════════════════════════════════════════════════════════════
-- 1. UNIVERSITIES
-- ═══════════════════════════════════════════════════════════════
INSERT INTO public.universities (codigo_mec, nome, sigla, tipo, estados, ranking_mec) VALUES
(1001, 'Universidade Anhembi Morumbi', 'Anhembi Morumbi', 'Privada', ARRAY['SP'], 4),
(1002, 'Pontifícia Universidade Católica de Campinas', 'PUC Campinas', 'Privada', ARRAY['SP'], 5),
(1003, 'Universidade Estadual Paulista', 'UNESP', 'Publica', ARRAY['SP'], 5),
(1004, 'Faculdade de Americana', 'FAM', 'Privada', ARRAY['SP'], 4),
(1005, 'Universidade Estácio de Sá', 'Estácio', 'Privada', ARRAY['SP', 'RJ', 'MG'], 4),
(1006, 'Universidade de São Paulo', 'USP', 'Publica', ARRAY['SP'], 5),
(1007, 'Fundação Getulio Vargas', 'FGV', 'Privada', ARRAY['SP', 'RJ'], 5)
ON CONFLICT (codigo_mec) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 2. SCHOLARSHIPS
-- ═══════════════════════════════════════════════════════════════
-- AM (Design Gráfico, ProUni, 100%, 642 corte)
INSERT INTO public.scholarships (id, university_id, curso_nome, programa, percentual, valor_mensalidade, nota_corte, vagas_total, vagas_disponiveis, renda_maxima, cotas, prazo_inscricao, ativo) VALUES
(1, (SELECT id FROM public.universities WHERE sigla = 'Anhembi Morumbi' LIMIT 1), 'Design Gráfico', 'ProUni', 100.00, 1240.00, 642.00, 15, 12, '1,5 SM', ARRAY['escola_publica', 'pcd', 'baixa_renda'], NOW() + INTERVAL '6 days', true),
(2, (SELECT id FROM public.universities WHERE sigla = 'PUC Campinas' LIMIT 1), 'Arquitetura e Urbanismo', 'ProUni', 50.00, 2180.00, 680.00, 10, 8, '3 SM', ARRAY['escola_publica', 'baixa_renda'], NOW() + INTERVAL '21 days', true),
(3, (SELECT id FROM public.universities WHERE sigla = 'UNESP' LIMIT 1), 'Artes Visuais', 'SISU', 100.00, 0.00, 622.00, 10, 8, NULL, ARRAY['racial', 'escola_publica'], NOW() + INTERVAL '16 days', true),
(4, (SELECT id FROM public.universities WHERE sigla = 'FAM' LIMIT 1), 'Psicologia', 'ProUni', 100.00, 1100.00, 560.00, 8, 5, '1,5 SM', ARRAY['escola_publica', 'pcd', 'baixa_renda'], NOW() + INTERVAL '4 days', true),
(5, (SELECT id FROM public.universities WHERE sigla = 'Estácio' LIMIT 1), 'Cinema e Audiovisual', 'FIES', 100.00, 1450.00, 450.00, 20, 15, '3 SM', ARRAY['renda'], NOW() + INTERVAL '26 days', true)
ON CONFLICT (id) DO NOTHING;

-- Adjust standard auto-increment serial for scholarships
SELECT setval('public.scholarships_id_seq', COALESCE((SELECT MAX(id)+1 FROM public.scholarships), 1), false);

-- ═══════════════════════════════════════════════════════════════
-- 3. CUT SCORE HISTORY
-- ═══════════════════════════════════════════════════════════════
-- Design Gráfico (AM) Cut Scores
INSERT INTO public.cut_score_history (scholarship_id, ano, nota_min, nota_max, nota_media) VALUES
(1, 2022, 620, 660, 638),
(1, 2023, 625, 672, 645),
(1, 2024, 630, 680, 650),
(1, 2025, 635, 685, 655),
-- Arquitetura (PUC)
(2, 2022, 660, 710, 678),
(2, 2023, 665, 715, 682),
(2, 2024, 670, 720, 690),
(2, 2025, 675, 722, 692),
-- Artes Visuais (UNESP)
(3, 2022, 600, 640, 615),
(3, 2023, 605, 645, 620),
(3, 2024, 610, 650, 625),
(3, 2025, 615, 652, 628);

-- ═══════════════════════════════════════════════════════════════
-- 4. DEADLINES
-- ═══════════════════════════════════════════════════════════════
INSERT INTO public.deadlines (programa, descricao, data_limite, source_url) VALUES
('ProUni', 'Inscrição Primeira Chamada', NOW() + INTERVAL '1 day', 'https://prouniportal.mec.gov.br/'),
('SISU', 'Inscrição Lista de Espera', NOW() + INTERVAL '10 days', 'https://sisuportal.mec.gov.br/'),
('FIES', 'Envio de documentação ao Banco', NOW() + INTERVAL '15 days', 'https://fiesportal.mec.gov.br/');

-- ═══════════════════════════════════════════════════════════════
-- 5. EVENTS
-- ═══════════════════════════════════════════════════════════════
INSERT INTO public.events (titulo, universidade_id, data, vagas, cidade, estado) VALUES
('Portas Abertas USP', (SELECT id FROM public.universities WHERE sigla = 'USP' LIMIT 1), NOW() + INTERVAL '3 days', 32, 'São Paulo', 'SP'),
('Dia do Vestibulando Mackenzie', (SELECT id FROM public.universities WHERE sigla = 'USP' LIMIT 1), NOW() + INTERVAL '7 days', 8, 'São Paulo', 'SP'),
('Visita Guiada FGV', (SELECT id FROM public.universities WHERE sigla = 'FGV' LIMIT 1), NOW() + INTERVAL '14 days', 0, 'São Paulo', 'SP');

-- ═══════════════ 3/4: storage_setup.sql ═══════════════
-- Roadmap Fase Final 1, item 1: private Storage bucket for uploaded documents.
-- Run in the Supabase SQL editor (or via `supabase db push` if migrations are used).
-- Path convention written by backend/src/services/storage.js: {user_id}/{application_id}/{tipo}-{timestamp}-{filename}

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Only the owning user (first path segment = auth.uid()) may read/write their own files.
create policy "Users can read own documents in storage"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own documents to storage"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own documents in storage"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Note: the backend uses the service role key for uploads/signed URLs (bypasses RLS),
-- so these policies are the safety net for any direct/client-side Storage access.

-- ═══════════════ 4/4: upgrade_producao.sql ═══════════════
-- Upgrade de Producao — Portal do Aluno
-- Script idempotente: pode ser executado em bancos ja provisionados com schema.sql.
-- Cobre as lacunas do ROADMAP.md: Hub B (indices), Hub F (quiz no banco),
-- Hub I (triggers de auditoria) e Hub J (NPS unico por ciclo).

-- ═══════════════════════════════════════════════════════════════
-- 1. EXTENSOES
-- ═══════════════════════════════════════════════════════════════
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ═══════════════════════════════════════════════════════════════
-- 2. HUB F — QUESTOES DO SIMULADO NO BANCO (substitui QUESTIONS_ENEM)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.quiz_questions (
    id bigserial primary key,
    area text not null,                 -- Linguagens, Matematica, Ciencias Humanas, Ciencias da Natureza, Redacao
    enunciado text not null,
    alternativas jsonb not null,        -- array de strings
    correta integer not null,           -- indice da alternativa correta
    explicacao text not null,
    ativo boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_questions enable row level security;

drop policy if exists "Anyone can view active quiz questions." on public.quiz_questions;
create policy "Anyone can view active quiz questions." on public.quiz_questions
    for select using (ativo = true);

-- Seed inicial (mesmas 5 questoes do codigo, agora administraveis sem redeploy)
insert into public.quiz_questions (area, enunciado, alternativas, correta, explicacao)
select * from (values
    ('Linguagens',
     'No romance "Dom Casmurro", de Machado de Assis, a ambiguidade da narrativa em torno da fidelidade de Capitu constitui um recurso literário que visa:',
     '["Provocar no leitor o mesmo estado de dúvida e ciúme obsessivo do narrador Bento Santiago.","Comprovar cientificamente o adultério de Capitu sob a ótica do Naturalismo oitocentista.","Explicar o processo jurídico de separação matrimonial na sociedade burguesa do Rio de Janeiro.","Ironizar a hipocrisia das famílias tradicionais que não aceitavam divórcios consensuais."]'::jsonb,
     0,
     'A narrativa em primeira pessoa transfere para o leitor o ciúme obsessivo de Bentinho, tornando a dúvida sobre Capitu a própria essência literária da obra.'),
    ('Matemática',
     'Uma pessoa aplica um capital de R$ 10.000,00 sob regime de juros simples com taxa de 1% ao mês por 5 meses. Qual o montante total resgatado ao final da aplicação?',
     '["R$ 10.500,00","R$ 10.050,00","R$ 11.000,00","R$ 10.100,00"]'::jsonb,
     0,
     'Juros simples: J = C * i * t = 10000 * 0.01 * 5 = R$ 500. Montante = C + J = R$ 10.500,00.'),
    ('Ciências Humanas',
     'A chamada "Era Vargas" (1930-1945) promoveu profundas transformações econômicas e sociais no Brasil, sendo a principal marca do seu modelo de desenvolvimento:',
     '["A industrialização por substituição de importações e a criação de leis trabalhistas (CLT).","A privatização de estatais de mineração e o foco exclusivo na exportação cafeeira.","A abertura irrestrita a capitais estrangeiros e a desregulamentação absoluta do mercado.","A reforma agrária radical em todo o território nacional com expropriação de latifúndios."]'::jsonb,
     0,
     'Getúlio Vargas liderou o processo de industrialização interna de base e instituiu a Consolidação das Leis do Trabalho (CLT).'),
    ('Ciências da Natureza',
     'As plantas clorofiladas produzem matéria orgânica e oxigênio molecular na fotossíntese. O oxigênio liberado na atmosfera provém diretamente de qual dessas substâncias?',
     '["Da fotólise da água (H₂O).","Da quebra do gás carbônico (CO₂).","Da respiração celular mitocondrial.","Da degradação enzimática da glicose."]'::jsonb,
     0,
     'Na fase clara da fotossíntese, ocorre a fotólise da água, processo no qual o oxigênio é gerado a partir do desprendimento das moléculas de água.'),
    ('Redação',
     'Na estrutura da redação dissertativo-argumentativa do ENEM, a proposta de intervenção social é avaliada na competência 5 e deve, obrigatoriamente, conter:',
     '["Agente, Ação, Meio/Modo, Efeito e Detalhamento de um dos elementos.","Apenas uma sugestão subjetiva sem especificações de executor ou resultados.","Citações históricas obrigatórias e referências filosóficas diretas.","Vocabulário rebuscado e proposição de alteração na Constituição Federal."]'::jsonb,
     0,
     'A competência 5 do ENEM pontua até 200 pontos com base na presença completa dos 5 elementos de intervenção social.')
) as seed(area, enunciado, alternativas, correta, explicacao)
where not exists (select 1 from public.quiz_questions);

-- ═══════════════════════════════════════════════════════════════
-- 3. HUB B — INDICES DE BUSCA (< 100ms)
-- ═══════════════════════════════════════════════════════════════
-- B-Tree para filtros exatos
create index if not exists idx_scholarships_programa on public.scholarships (programa);
create index if not exists idx_scholarships_ativo on public.scholarships (ativo);
create index if not exists idx_scholarships_nota_corte on public.scholarships (nota_corte);
create index if not exists idx_scholarships_percentual on public.scholarships (percentual);
create index if not exists idx_scholarships_prazo on public.scholarships (prazo_inscricao);
create index if not exists idx_scholarships_university on public.scholarships (university_id);
create index if not exists idx_applications_user on public.applications (user_id);
create index if not exists idx_documents_application on public.documents (application_id);
create index if not exists idx_notifications_user_read on public.notifications (user_id, read_at);
create index if not exists idx_alerts_user_ativo on public.alerts (user_id, ativo);

-- GIN + trigram para busca textual em nomes de cursos e faculdades
create index if not exists idx_scholarships_curso_trgm on public.scholarships using gin (curso_nome gin_trgm_ops);
create index if not exists idx_universities_nome_trgm on public.universities using gin (nome gin_trgm_ops);

-- ═══════════════════════════════════════════════════════════════
-- 4. HUB I — TRIGGERS DE AUDITORIA (conformidade e antifraude)
-- ═══════════════════════════════════════════════════════════════
create or replace function public.log_activity()
returns trigger as $$
begin
    if (tg_table_name = 'applications') then
        insert into public.activity_log (user_id, tipo, dados)
        values (new.user_id, 'candidatura_iniciada', jsonb_build_object('application_id', new.id, 'scholarship_id', new.scholarship_id));
    elsif (tg_table_name = 'documents') then
        insert into public.activity_log (user_id, tipo, dados)
        select a.user_id, 'documento_enviado', jsonb_build_object('document_id', new.id, 'tipo', new.tipo)
        from public.applications a where a.id = new.application_id;
    elsif (tg_table_name = 'nps_responses') then
        insert into public.activity_log (user_id, tipo, dados)
        values (new.user_id, 'nps_enviado', jsonb_build_object('score', new.score));
    end if;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_application on public.applications;
create trigger trg_log_application
    after insert on public.applications
    for each row execute procedure public.log_activity();

drop trigger if exists trg_log_document on public.documents;
create trigger trg_log_document
    after insert on public.documents
    for each row execute procedure public.log_activity();

drop trigger if exists trg_log_nps on public.nps_responses;
create trigger trg_log_nps
    after insert on public.nps_responses
    for each row execute procedure public.log_activity();

-- ═══════════════════════════════════════════════════════════════
-- 5. HUB H — TOKENS DE NOTIFICACAO PUSH (Firebase Cloud Messaging)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.push_tokens (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    token text not null unique,
    plataforma text default 'web' not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.push_tokens enable row level security;

drop policy if exists "Users can manage own push tokens" on public.push_tokens;
create policy "Users can manage own push tokens" on public.push_tokens
    for all using (auth.uid() = user_id);

create index if not exists idx_push_tokens_user on public.push_tokens (user_id);

-- ═══════════════════════════════════════════════════════════════
-- 6. HUB J — NPS: UMA RESPOSTA POR USUARIO POR CICLO
-- ═══════════════════════════════════════════════════════════════
alter table public.nps_responses
    add column if not exists ciclo text not null default 'beta-2026';

create unique index if not exists uniq_nps_user_ciclo
    on public.nps_responses (user_id, ciclo)
    where user_id is not null;
