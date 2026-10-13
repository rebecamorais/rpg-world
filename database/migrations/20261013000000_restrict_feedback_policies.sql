-- Remove as policies abertas da tabela feedback.
-- "feedback_view_as_admin" (SELECT USING true) permitia que qualquer pessoa com a
-- publishable key lesse todos os feedbacks (emails e mensagens) via REST.
-- "feedback_insert" (INSERT WITH CHECK true) permitia inserir direto, sem passar
-- pela validação do backend.
-- O backend grava com o service role, que ignora RLS, então nenhuma policy é necessária.
DROP POLICY IF EXISTS "feedback_view_as_admin" ON public.feedback;
DROP POLICY IF EXISTS "feedback_insert" ON public.feedback;
