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
