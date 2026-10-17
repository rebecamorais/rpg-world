-- Aplica no próprio Storage os limites que antes só existiam nos casos de uso de upload.
-- As policies do bucket 'avatars' só conferem a pasta do usuário, e qualquer usuário logado tem
-- o JWT e a chave publicável: dava para enviar direto ao Storage um arquivo de qualquer tipo
-- (ex.: SVG com <script>, servido depois pelo /api/images) e de qualquer tamanho.
-- Tipos iguais a ALLOWED_AVATAR_TYPES; tamanho igual ao maior limite da API (avatar do perfil, 5 MB).
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 5242880
WHERE id = 'avatars';
