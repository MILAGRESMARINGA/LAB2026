-- LABGame rights resolution #83. Requires verified backup-restore gate.
-- NO copyrighted text is erased. Public access is controlled by availability RLS.
-- Third-party code repository license is NOT permission for Bible translation text.
begin;
alter table public.lab_bible_edition_availability
 add column if not exists license_status text not null default 'pending_proof',
 add column if not exists source_artifact_sha256 text,
 add column if not exists source_artifact_url text,
 add column if not exists source_version text;

alter table public.lab_bible_edition_availability
 drop constraint if exists lab_bible_edition_availability_license_status_check;
alter table public.lab_bible_edition_availability
 add constraint lab_bible_edition_availability_license_status_check
 check (license_status in (
   'pending_proof','requires_commercial_contract_or_official_api',
   'public_domain_verified','open_license_verified','licensed_by_rightsholder'
 ));

alter table public.lab_bible_edition_availability
 drop constraint if exists lab_bible_edition_availability_source_sha256_check;
alter table public.lab_bible_edition_availability
 add constraint lab_bible_edition_availability_source_sha256_check
 check (source_artifact_sha256 is null or source_artifact_sha256 ~ '^[0-9a-f]{64}$');

-- A legally open license is distinct from public domain and a restricted license.
alter table public.lab_bible_edition_availability
 drop constraint if exists lab_bible_edition_availability_rights_status_check;
alter table public.lab_bible_edition_availability
 add constraint lab_bible_edition_availability_rights_status_check
 check (rights_status in ('pending','licensed','public_domain','open_license'));

-- Deny authenticated and anonymous distribution through all existing Bible RLS
-- before removing inaccurate proof or changing its rights status.
update public.lab_bible_edition_availability
set available=false,
    rights_status='pending',
    license_status='requires_commercial_contract_or_official_api',
    rights_evidence_url=null,
    license_label='Direitos reservados: contrato do titular ou API oficial necessária. Sem autorização para redistribuição pública.'
where code in ('NVI','NAA','ARA','NTLH');

update public.lab_bible_editions
set license_label='Direitos reservados; a licença MIT de qualquer software de terceiros não autoriza republicação desta tradução.',
    attribution='Tradução protegida. Direitos digitais pendentes de contrato/documento do titular.'
where code in ('NVI','NAA','ARA','NTLH');

update public.lab_bible_edition_availability
set license_status='public_domain_verified'
where code in ('ALM1911','KJV') and rights_status='public_domain'
 and rights_evidence_url is not null;

-- A free, independently licensed Bible is registered but NOT displayed
-- until its exact source download is hashed and 66/1,189 chapters are validated.
insert into public.lab_bible_editions
 (code,title,language_code,attribution,source_url,license_label)
values
 ('BLIVRE','Bíblia Livre (TR, edição fevereiro 2018)','pt',
 'Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio e Marco Teles; licença Creative Commons Atribuição 3.0 Brasil; indicação de edição e alterações obrigatória.',
 'https://github.com/blivre/BibliaLivre',
 'Creative Commons Atribuição 3.0 Brasil (CC BY 3.0 BR); não é CC BY-SA.'),
 ('BPM','Bíblia Portuguesa Mundial (BPM)','pt',
 'Bíblia Portuguesa Mundial / World Portuguese Bible; eBible.org; domínio público; tradução ainda em revisão.',
 'https://ebible.org/find/details.php?id=porbrbsl',
 'Domínio público segundo eBible.org; tradução em revisão.')
on conflict (code) do nothing;

insert into public.lab_bible_edition_availability
 (code,title,display_order,available,requires_auth,license_label,rights_status,rights_evidence_url,content_ready,license_status,source_artifact_url,source_version)
values
 ('BLIVRE','Bíblia Livre (TR, 2018)',6,false,false,
  'CC BY 3.0 Brasil: © Diego Santos, Mario Sérgio e Marco Teles; versão fevereiro 2018.',
  'open_license','https://github.com/blivre/BibliaLivre/blob/master/LICENCA.md',
  false,'open_license_verified',
  'https://github.com/blivre/BibliaLivre/releases','2018-02 (TR)'),
 ('BPM','Bíblia Portuguesa Mundial',7,false,false,
  'Domínio público: eBible.org; tradução em revisão.',
  'public_domain','https://ebible.org/find/details.php?id=porbrbsl',
  false,'public_domain_verified',
  'https://ebible.org/Scriptures/porbrbsl_usfm.zip','2026-10-08')
on conflict (code) do nothing;

alter table public.lab_bible_edition_availability
 drop constraint if exists lab_bible_edition_public_source_gate;
alter table public.lab_bible_edition_availability
 add constraint lab_bible_edition_public_source_gate check (
   not available or (
    license_status in ('public_domain_verified','open_license_verified','licensed_by_rightsholder')
    and rights_status in ('public_domain','open_license','licensed')
    and rights_evidence_url is not null and content_ready
    and (code not in ('BPM','BLIVRE') or (
       source_artifact_sha256 ~ '^[0-9a-f]{64}$' and
       source_artifact_url is not null and source_version is not null
    ))
   )
 );
-- No API.Bible key or external endpoint is needed; it is an alternative
-- only after a specific version agreement, terms, attribution and cache policy.
commit;
