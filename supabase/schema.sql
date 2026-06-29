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
