-- LABGAME: restore authenticated access, keep anonymous writes blocked,
-- and enable invitation-based reading groups with row-level security.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reading_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reading_groups TO authenticated;
GRANT SELECT, DELETE ON TABLE public.reading_group_members TO authenticated;

CREATE TABLE IF NOT EXISTS public.reading_group_invites (
  group_id uuid PRIMARY KEY REFERENCES public.reading_groups(id) ON DELETE CASCADE,
  invite_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reading_group_invites ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.reading_group_invites TO authenticated;

CREATE POLICY "Owners read their group invitations"
  ON public.reading_group_invites FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reading_groups g
    WHERE g.id = group_id AND g.owner_id = (SELECT auth.uid())
  ));

CREATE OR REPLACE FUNCTION public.is_reading_group_member(p_group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.reading_group_members m
    WHERE m.group_id = p_group_id AND m.user_id = (SELECT auth.uid())
  )
$function$;
REVOKE ALL ON FUNCTION public.is_reading_group_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_reading_group_member(uuid) TO authenticated;

CREATE POLICY "Members see joined groups"
  ON public.reading_groups FOR SELECT TO authenticated
  USING (public.is_reading_group_member(id));

CREATE POLICY "Owner updates group"
  ON public.reading_groups FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Owner deletes group"
  ON public.reading_groups FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Owner sees group membership"
  ON public.reading_group_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reading_groups g
    WHERE g.id = group_id AND g.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY "Members leave group"
  ON public.reading_group_members FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND NOT EXISTS (
    SELECT 1 FROM public.reading_groups g
    WHERE g.id = group_id AND g.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY "Owner removes member"
  ON public.reading_group_members FOR DELETE TO authenticated
  USING (user_id <> (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.reading_groups g
    WHERE g.id = group_id AND g.owner_id = (SELECT auth.uid())
  ));

CREATE OR REPLACE FUNCTION public.register_reading_group_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.reading_group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'leader')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  INSERT INTO public.reading_group_invites (group_id)
  VALUES (NEW.id)
  ON CONFLICT (group_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS on_reading_group_created ON public.reading_groups;
CREATE TRIGGER on_reading_group_created AFTER INSERT ON public.reading_groups
FOR EACH ROW EXECUTE FUNCTION public.register_reading_group_owner();

-- If groups predated this migration, generate their invitations and owner memberships.
INSERT INTO public.reading_group_members (group_id,user_id,role)
SELECT id,owner_id,'leader' FROM public.reading_groups
ON CONFLICT (group_id,user_id) DO NOTHING;
INSERT INTO public.reading_group_invites (group_id)
SELECT id FROM public.reading_groups
ON CONFLICT (group_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.join_reading_group(p_invite_token uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_group_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;
  SELECT i.group_id INTO v_group_id
  FROM public.reading_group_invites i
  WHERE i.invite_token = p_invite_token;
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido';
  END IF;
  INSERT INTO public.reading_group_members (group_id,user_id,role)
  VALUES (v_group_id,v_user_id,'member')
  ON CONFLICT (group_id,user_id) DO NOTHING;
  RETURN v_group_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.join_reading_group(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_reading_group(uuid) TO authenticated;
