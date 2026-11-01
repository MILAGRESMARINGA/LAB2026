-- LABGame 3.0 public-editions-only catalog (01 November 2026).
-- Existing restricted texts are retained internally; RLS denies all public reads.
-- Production rights status was safely disabled on 2026-11-01; migration is idempotent.
-- The GitHub MIT licence is not a licence for Bible translation text.
begin;
update public.lab_bible_edition_availability
   set available=false, rights_status='pending',
       rights_evidence_url=null,requires_auth=true,
       license_label='Direitos reservados; sem redistribuição pública até contrato do titular.'
 where code in ('NVI','NAA','ARA','NTLH');
do $rights$
begin
 -- A fresh local Supabase may not have the optional KJV import yet.
 if not exists(select 1 from public.lab_bible_edition_availability
       where code='ALM1911' and available=true and rights_status='public_domain') then
   raise exception 'FAIL: Almeida 1911 must remain publicly available';
 end if;
 if exists(select 1 from public.lab_bible_edition_availability
       where code='KJV' and available=true and rights_status<>'public_domain') then
   raise exception 'FAIL: available KJV must be public domain';
 end if;
 if exists(select 1 from public.lab_bible_edition_availability
       where available=true and code not in('ALM1911','KJV')) then
   raise exception 'FAIL: unexpected public translation';
 end if;
 if exists(select 1 from public.lab_bible_edition_availability
       where code in('NVI','NAA','ARA','NTLH')
         and (available or rights_evidence_url is not null
           or rights_status='licensed')) then
   raise exception 'FAIL: restricted text claims licensed';
 end if;
end $rights$;
commit;
