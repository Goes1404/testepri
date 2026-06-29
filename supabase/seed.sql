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
