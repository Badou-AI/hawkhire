drop trigger if exists "before_company_insert_update" on "public"."companies";

drop trigger if exists "update_companies_updated_at" on "public"."companies";

drop trigger if exists "set_organization_members_updated_at" on "public"."organization_members";

drop trigger if exists "set_organization_news_updated_at" on "public"."organization_news";

drop trigger if exists "set_organizations_updated_at" on "public"."organizations";

drop trigger if exists "set_testimonials_updated_at" on "public"."testimonials";

drop policy "Company owners have full access" on "public"."companies";

drop policy "Verified companies are viewable by everyone" on "public"."companies";

drop policy "Company owners can view their verifications" on "public"."company_verifications";

drop policy "Platform admins can manage verifications" on "public"."company_verifications";

drop policy "Organization admins can manage members" on "public"."organization_members";

drop policy "Organization members can view their memberships" on "public"."organization_members";

drop policy "Organization admins can manage news" on "public"."organization_news";

drop policy "View news for verified organizations" on "public"."organization_news";

drop policy "Anyone can view verified organizations" on "public"."organizations";

drop policy "Organization admins can manage testimonials" on "public"."testimonials";

drop policy "View testimonials for verified organizations" on "public"."testimonials";

revoke delete on table "public"."companies" from "anon";

revoke insert on table "public"."companies" from "anon";

revoke references on table "public"."companies" from "anon";

revoke select on table "public"."companies" from "anon";

revoke trigger on table "public"."companies" from "anon";

revoke truncate on table "public"."companies" from "anon";

revoke update on table "public"."companies" from "anon";

revoke delete on table "public"."companies" from "authenticated";

revoke insert on table "public"."companies" from "authenticated";

revoke references on table "public"."companies" from "authenticated";

revoke select on table "public"."companies" from "authenticated";

revoke trigger on table "public"."companies" from "authenticated";

revoke truncate on table "public"."companies" from "authenticated";

revoke update on table "public"."companies" from "authenticated";

revoke delete on table "public"."companies" from "service_role";

revoke insert on table "public"."companies" from "service_role";

revoke references on table "public"."companies" from "service_role";

revoke select on table "public"."companies" from "service_role";

revoke trigger on table "public"."companies" from "service_role";

revoke truncate on table "public"."companies" from "service_role";

revoke update on table "public"."companies" from "service_role";

revoke delete on table "public"."company_verifications" from "anon";

revoke insert on table "public"."company_verifications" from "anon";

revoke references on table "public"."company_verifications" from "anon";

revoke select on table "public"."company_verifications" from "anon";

revoke trigger on table "public"."company_verifications" from "anon";

revoke truncate on table "public"."company_verifications" from "anon";

revoke update on table "public"."company_verifications" from "anon";

revoke delete on table "public"."company_verifications" from "authenticated";

revoke insert on table "public"."company_verifications" from "authenticated";

revoke references on table "public"."company_verifications" from "authenticated";

revoke select on table "public"."company_verifications" from "authenticated";

revoke trigger on table "public"."company_verifications" from "authenticated";

revoke truncate on table "public"."company_verifications" from "authenticated";

revoke update on table "public"."company_verifications" from "authenticated";

revoke delete on table "public"."company_verifications" from "service_role";

revoke insert on table "public"."company_verifications" from "service_role";

revoke references on table "public"."company_verifications" from "service_role";

revoke select on table "public"."company_verifications" from "service_role";

revoke trigger on table "public"."company_verifications" from "service_role";

revoke truncate on table "public"."company_verifications" from "service_role";

revoke update on table "public"."company_verifications" from "service_role";

revoke delete on table "public"."organization_news" from "anon";

revoke insert on table "public"."organization_news" from "anon";

revoke references on table "public"."organization_news" from "anon";

revoke select on table "public"."organization_news" from "anon";

revoke trigger on table "public"."organization_news" from "anon";

revoke truncate on table "public"."organization_news" from "anon";

revoke update on table "public"."organization_news" from "anon";

revoke delete on table "public"."organization_news" from "authenticated";

revoke insert on table "public"."organization_news" from "authenticated";

revoke references on table "public"."organization_news" from "authenticated";

revoke select on table "public"."organization_news" from "authenticated";

revoke trigger on table "public"."organization_news" from "authenticated";

revoke truncate on table "public"."organization_news" from "authenticated";

revoke update on table "public"."organization_news" from "authenticated";

revoke delete on table "public"."organization_news" from "service_role";

revoke insert on table "public"."organization_news" from "service_role";

revoke references on table "public"."organization_news" from "service_role";

revoke select on table "public"."organization_news" from "service_role";

revoke trigger on table "public"."organization_news" from "service_role";

revoke truncate on table "public"."organization_news" from "service_role";

revoke update on table "public"."organization_news" from "service_role";

revoke delete on table "public"."testimonials" from "anon";

revoke insert on table "public"."testimonials" from "anon";

revoke references on table "public"."testimonials" from "anon";

revoke select on table "public"."testimonials" from "anon";

revoke trigger on table "public"."testimonials" from "anon";

revoke truncate on table "public"."testimonials" from "anon";

revoke update on table "public"."testimonials" from "anon";

revoke delete on table "public"."testimonials" from "authenticated";

revoke insert on table "public"."testimonials" from "authenticated";

revoke references on table "public"."testimonials" from "authenticated";

revoke select on table "public"."testimonials" from "authenticated";

revoke trigger on table "public"."testimonials" from "authenticated";

revoke truncate on table "public"."testimonials" from "authenticated";

revoke update on table "public"."testimonials" from "authenticated";

revoke delete on table "public"."testimonials" from "service_role";

revoke insert on table "public"."testimonials" from "service_role";

revoke references on table "public"."testimonials" from "service_role";

revoke select on table "public"."testimonials" from "service_role";

revoke trigger on table "public"."testimonials" from "service_role";

revoke truncate on table "public"."testimonials" from "service_role";

revoke update on table "public"."testimonials" from "service_role";

alter table "public"."companies" drop constraint "companies_owner_id_fkey";

alter table "public"."companies" drop constraint "companies_slug_key";

alter table "public"."company_verifications" drop constraint "company_verifications_company_id_fkey";

alter table "public"."company_verifications" drop constraint "company_verifications_verified_by_fkey";

alter table "public"."organization_news" drop constraint "organization_news_organization_id_fkey";

alter table "public"."testimonials" drop constraint "testimonials_organization_id_fkey";

alter table "public"."organization_members" drop constraint "organization_members_organization_id_fkey";

alter table "public"."organization_members" drop constraint "organization_members_user_id_fkey";

drop function if exists "public"."generate_company_slug"();

drop function if exists "public"."trigger_set_updated_at"();

drop function if exists "public"."update_updated_at_column"();

alter table "public"."companies" drop constraint "companies_pkey";

alter table "public"."company_verifications" drop constraint "company_verifications_pkey";

alter table "public"."organization_news" drop constraint "organization_news_pkey";

alter table "public"."testimonials" drop constraint "testimonials_pkey";

drop index if exists "public"."companies_owner_id_idx";

drop index if exists "public"."companies_pkey";

drop index if exists "public"."companies_slug_idx";

drop index if exists "public"."companies_slug_key";

drop index if exists "public"."companies_verification_status_idx";

drop index if exists "public"."company_verifications_company_id_idx";

drop index if exists "public"."company_verifications_pkey";

drop index if exists "public"."organization_members_org_id_idx";

drop index if exists "public"."organization_members_user_id_idx";

drop index if exists "public"."organization_news_organization_id_idx";

drop index if exists "public"."organization_news_pkey";

drop index if exists "public"."organization_news_published_at_idx";

drop index if exists "public"."organizations_slug_idx";

drop index if exists "public"."testimonials_organization_id_idx";

drop index if exists "public"."testimonials_pkey";

drop table "public"."companies";

drop table "public"."company_verifications";

drop table "public"."organization_news";

drop table "public"."testimonials";

create table "public"."jobs" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid not null,
    "title" text not null,
    "description" text not null,
    "requirements" text[] not null,
    "skills" text[] not null,
    "status" text not null default 'draft'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "location" text,
    "job_type" text,
    "salary_min" integer,
    "salary_max" integer,
    "remote" boolean default false,
    "rating" numeric(2,1)
);


alter table "public"."jobs" enable row level security;

create table "public"."organization_verifications" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid,
    "status" text not null,
    "verified_by" uuid,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."organization_verifications" enable row level security;

create table "public"."resumes" (
    "id" uuid not null default uuid_generate_v4(),
    "job_id" uuid not null,
    "user_id" uuid not null,
    "file_path" text not null,
    "file_name" text not null,
    "file_size" integer not null,
    "mime_type" text not null,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."resumes" enable row level security;

alter table "public"."organization_members" alter column "permissions" set not null;

alter table "public"."organization_members" alter column "role" drop default;

alter table "public"."organizations" drop column "benefits";

alter table "public"."organizations" drop column "culture_values";

alter table "public"."organizations" drop column "social_links";

alter table "public"."organizations" drop column "storage_limit";

alter table "public"."organizations" drop column "storage_used";

alter table "public"."organizations" alter column "company_type" drop default;

alter table "public"."organizations" alter column "members" drop default;

alter table "public"."organizations" alter column "members" set not null;

alter table "public"."organizations" alter column "tier" drop default;

drop type "public"."company_type";

CREATE INDEX idx_jobs_created_at ON public.jobs USING btree (created_at DESC);

CREATE INDEX idx_jobs_job_type ON public.jobs USING btree (job_type);

CREATE INDEX idx_jobs_location ON public.jobs USING btree (location);

CREATE INDEX idx_jobs_remote ON public.jobs USING btree (remote);

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);

CREATE INDEX idx_organization_members_organization_id ON public.organization_members USING btree (organization_id);

CREATE INDEX idx_organization_members_user_id ON public.organization_members USING btree (user_id);

CREATE INDEX idx_organization_verifications_organization_id ON public.organization_verifications USING btree (organization_id);

CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id);

CREATE UNIQUE INDEX organization_verifications_pkey ON public.organization_verifications USING btree (id);

CREATE UNIQUE INDEX resumes_pkey ON public.resumes USING btree (id);

alter table "public"."jobs" add constraint "jobs_pkey" PRIMARY KEY using index "jobs_pkey";

alter table "public"."organization_verifications" add constraint "organization_verifications_pkey" PRIMARY KEY using index "organization_verifications_pkey";

alter table "public"."resumes" add constraint "resumes_pkey" PRIMARY KEY using index "resumes_pkey";

alter table "public"."jobs" add constraint "jobs_job_type_check" CHECK ((job_type = ANY (ARRAY['full-time'::text, 'part-time'::text, 'contract'::text, 'internship'::text]))) not valid;

alter table "public"."jobs" validate constraint "jobs_job_type_check";

alter table "public"."jobs" add constraint "jobs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) not valid;

alter table "public"."jobs" validate constraint "jobs_organization_id_fkey";

alter table "public"."jobs" add constraint "jobs_rating_check" CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric))) not valid;

alter table "public"."jobs" validate constraint "jobs_rating_check";

alter table "public"."jobs" add constraint "jobs_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'closed'::text]))) not valid;

alter table "public"."jobs" validate constraint "jobs_status_check";

alter table "public"."organization_verifications" add constraint "organization_verifications_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) not valid;

alter table "public"."organization_verifications" validate constraint "organization_verifications_organization_id_fkey";

alter table "public"."organization_verifications" add constraint "organization_verifications_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES auth.users(id) not valid;

alter table "public"."organization_verifications" validate constraint "organization_verifications_verified_by_fkey";

alter table "public"."organizations" add constraint "organizations_tier_check" CHECK ((tier = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text]))) not valid;

alter table "public"."organizations" validate constraint "organizations_tier_check";

alter table "public"."resumes" add constraint "resumes_job_id_fkey" FOREIGN KEY (job_id) REFERENCES jobs(id) not valid;

alter table "public"."resumes" validate constraint "resumes_job_id_fkey";

alter table "public"."resumes" add constraint "resumes_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'rejected'::text]))) not valid;

alter table "public"."resumes" validate constraint "resumes_status_check";

alter table "public"."organization_members" add constraint "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) not valid;

alter table "public"."organization_members" validate constraint "organization_members_organization_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."organization_members" validate constraint "organization_members_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_organization_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."jobs" to "anon";

grant insert on table "public"."jobs" to "anon";

grant references on table "public"."jobs" to "anon";

grant select on table "public"."jobs" to "anon";

grant trigger on table "public"."jobs" to "anon";

grant truncate on table "public"."jobs" to "anon";

grant update on table "public"."jobs" to "anon";

grant delete on table "public"."jobs" to "authenticated";

grant insert on table "public"."jobs" to "authenticated";

grant references on table "public"."jobs" to "authenticated";

grant select on table "public"."jobs" to "authenticated";

grant trigger on table "public"."jobs" to "authenticated";

grant truncate on table "public"."jobs" to "authenticated";

grant update on table "public"."jobs" to "authenticated";

grant delete on table "public"."jobs" to "service_role";

grant insert on table "public"."jobs" to "service_role";

grant references on table "public"."jobs" to "service_role";

grant select on table "public"."jobs" to "service_role";

grant trigger on table "public"."jobs" to "service_role";

grant truncate on table "public"."jobs" to "service_role";

grant update on table "public"."jobs" to "service_role";

grant delete on table "public"."organization_verifications" to "anon";

grant insert on table "public"."organization_verifications" to "anon";

grant references on table "public"."organization_verifications" to "anon";

grant select on table "public"."organization_verifications" to "anon";

grant trigger on table "public"."organization_verifications" to "anon";

grant truncate on table "public"."organization_verifications" to "anon";

grant update on table "public"."organization_verifications" to "anon";

grant delete on table "public"."organization_verifications" to "authenticated";

grant insert on table "public"."organization_verifications" to "authenticated";

grant references on table "public"."organization_verifications" to "authenticated";

grant select on table "public"."organization_verifications" to "authenticated";

grant trigger on table "public"."organization_verifications" to "authenticated";

grant truncate on table "public"."organization_verifications" to "authenticated";

grant update on table "public"."organization_verifications" to "authenticated";

grant delete on table "public"."organization_verifications" to "service_role";

grant insert on table "public"."organization_verifications" to "service_role";

grant references on table "public"."organization_verifications" to "service_role";

grant select on table "public"."organization_verifications" to "service_role";

grant trigger on table "public"."organization_verifications" to "service_role";

grant truncate on table "public"."organization_verifications" to "service_role";

grant update on table "public"."organization_verifications" to "service_role";

grant delete on table "public"."resumes" to "anon";

grant insert on table "public"."resumes" to "anon";

grant references on table "public"."resumes" to "anon";

grant select on table "public"."resumes" to "anon";

grant trigger on table "public"."resumes" to "anon";

grant truncate on table "public"."resumes" to "anon";

grant update on table "public"."resumes" to "anon";

grant delete on table "public"."resumes" to "authenticated";

grant insert on table "public"."resumes" to "authenticated";

grant references on table "public"."resumes" to "authenticated";

grant select on table "public"."resumes" to "authenticated";

grant trigger on table "public"."resumes" to "authenticated";

grant truncate on table "public"."resumes" to "authenticated";

grant update on table "public"."resumes" to "authenticated";

grant delete on table "public"."resumes" to "service_role";

grant insert on table "public"."resumes" to "service_role";

grant references on table "public"."resumes" to "service_role";

grant select on table "public"."resumes" to "service_role";

grant trigger on table "public"."resumes" to "service_role";

grant truncate on table "public"."resumes" to "service_role";

grant update on table "public"."resumes" to "service_role";

create policy "Jobs are insertable by authenticated users"
on "public"."jobs"
as permissive
for insert
to public
with check ((auth.jwt() IS NOT NULL));


create policy "Jobs are updatable by organization members"
on "public"."jobs"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = jobs.organization_id) AND ((auth.jwt() ->> 'email'::text) = ANY (organizations.members))))));


create policy "Published jobs are viewable by anyone"
on "public"."jobs"
as permissive
for select
to public
using (((status = 'published'::text) OR (EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = jobs.organization_id) AND ((auth.jwt() ->> 'email'::text) = ANY (organizations.members)))))));


create policy "Members insertable by organization admins"
on "public"."organization_members"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = organization_members.organization_id) AND (auth.email() = ANY (organizations.members))))));


create policy "Members updatable by organization admins"
on "public"."organization_members"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = organization_members.organization_id) AND (auth.email() = ANY (organizations.members))))));


create policy "Members viewable by organization members"
on "public"."organization_members"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = organization_members.organization_id) AND (auth.email() = ANY (organizations.members))))));


create policy "Verification history viewable by organization members and platf"
on "public"."organization_verifications"
as permissive
for select
to public
using (((EXISTS ( SELECT 1
   FROM organizations
  WHERE ((organizations.id = organization_verifications.organization_id) AND (auth.email() = ANY (organizations.members))))) OR (auth.role() = 'service_role'::text)));


create policy "Verifications insertable by platform admins only"
on "public"."organization_verifications"
as permissive
for insert
to public
with check ((auth.role() = 'service_role'::text));


create policy "Organizations are updatable by members"
on "public"."organizations"
as permissive
for update
to public
using (((auth.jwt() IS NOT NULL) AND ((auth.jwt() ->> 'email'::text) = ANY (members))));


create policy "Organizations are viewable by members"
on "public"."organizations"
as permissive
for select
to public
using (((auth.jwt() IS NOT NULL) AND ((auth.jwt() ->> 'email'::text) = ANY (members))));


create policy "Users can create organizations"
on "public"."organizations"
as permissive
for insert
to public
with check (((auth.jwt() IS NOT NULL) AND ((auth.jwt() ->> 'email'::text) = ANY (members))));


create policy "Resumes are insertable by authenticated users for published job"
on "public"."resumes"
as permissive
for insert
to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM jobs
  WHERE ((jobs.id = resumes.job_id) AND (jobs.status = 'published'::text))))));


create policy "Resumes are updatable by organization members"
on "public"."resumes"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (jobs
     JOIN organizations ON ((jobs.organization_id = organizations.id)))
  WHERE ((jobs.id = resumes.job_id) AND ((auth.jwt() ->> 'email'::text) = ANY (organizations.members))))));


create policy "Resumes are viewable by owner and organization members"
on "public"."resumes"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM (jobs
     JOIN organizations ON ((jobs.organization_id = organizations.id)))
  WHERE ((jobs.id = resumes.job_id) AND ((auth.jwt() ->> 'email'::text) = ANY (organizations.members)))))));


CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON public.organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER generate_organization_slug_trigger BEFORE INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION generate_organization_slug();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at();


