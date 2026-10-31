-- O mestre lê a ficha inteira (personagem, lore e magias) dos personagens levados às mesas dele.
--
-- Só leitura: as políticas são FOR SELECT, e as de escrita continuam exigindo ser o dono. Vale
-- enquanto o personagem está na mesa, o dono é membro ativo e o personagem não foi apagado.
-- Colegas de mesa não ganham nada aqui: o que eles veem é o "básico" de party_roster.

CREATE FUNCTION private.gm_reads_character(p_character_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.party_characters AS pc
    JOIN public.parties AS p ON p.id = pc.party_id
    JOIN public.characters AS c ON c.id = pc.character_id
    JOIN public.party_members AS m
      ON m.party_id = pc.party_id AND m.user_id = c.owner_id AND m.status = 'active'
    WHERE pc.character_id = p_character_id
      AND p.gm_id = (SELECT auth.uid())
      AND c.kind = 'pc'
      AND c.deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION private.gm_reads_character(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.gm_reads_character(uuid) TO authenticated, service_role;

CREATE POLICY "characters_select_party_gm"
  ON public.characters FOR SELECT
  USING (private.gm_reads_character(id));

CREATE POLICY "character_lore_select_party_gm"
  ON public.character_lore FOR SELECT
  USING (private.gm_reads_character(character_id));

CREATE POLICY "character_spells_select_party_gm"
  ON public.character_spells FOR SELECT
  USING (private.gm_reads_character(character_id));
