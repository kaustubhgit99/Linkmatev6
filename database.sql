-- =============================================
-- LINKMATE — Supabase Database Setup
-- Paste this into Supabase SQL Editor and Run
-- Safe to run multiple times (idempotent)
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- TABLES ----

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen','owner','admin')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  rent_price NUMERIC NOT NULL DEFAULT 0 CHECK (rent_price >= 0),
  location TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  room_type TEXT NOT NULL DEFAULT 'Single Room',
  amenities TEXT[] DEFAULT '{}',
  num_beds INTEGER NOT NULL DEFAULT 1,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.room_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- ---- INDEXES ----
CREATE INDEX IF NOT EXISTS idx_rooms_owner   ON public.rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_rooms_city    ON public.rooms(city);
CREATE INDEX IF NOT EXISTS idx_rooms_avail   ON public.rooms(is_available);
CREATE INDEX IF NOT EXISTS idx_room_images_room ON public.room_images(room_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user   ON public.favorites(user_id);

-- ---- AUTO-UPDATE TRIGGER ----
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS rooms_updated_at ON public.rooms;
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---- AUTO-CREATE USER PROFILE ON SIGNUP ----
-- This trigger fires when a new user is created in auth.users.
-- It creates the matching row in public.users with the role from signup metadata.
-- SECURITY DEFINER means it runs as the function owner (bypasses RLS) — safe here
-- because we are only inserting the row for the newly created user.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role TEXT;
  _full_name TEXT;
BEGIN
  -- Read role from user metadata set during signup
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'citizen');
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Validate role — only allow citizen or owner via signup (admin must be set manually)
  IF _role NOT IN ('citizen', 'owner') THEN
    _role := 'citizen';
  END IF;

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, _full_name, _role)
  ON CONFLICT (id) DO UPDATE
    SET
      email     = EXCLUDED.email,
      full_name = CASE WHEN public.users.full_name IS NULL THEN EXCLUDED.full_name ELSE public.users.full_name END,
      role      = CASE WHEN public.users.role = 'citizen' THEN EXCLUDED.role ELSE public.users.role END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---- ROW LEVEL SECURITY ----
ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites  ENABLE ROW LEVEL SECURITY;

-- Drop old policies safely
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Users table policies
-- Anyone can read any user (needed for room owner details)
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
-- Users can insert their own row (for client-side upsert if trigger is slow)
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can only update their own profile
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Rooms
CREATE POLICY "rooms_select" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "rooms_update" ON public.rooms FOR UPDATE USING (
  auth.uid() = owner_id
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "rooms_delete" ON public.rooms FOR DELETE USING (
  auth.uid() = owner_id
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Room images
CREATE POLICY "images_select" ON public.room_images FOR SELECT USING (true);
CREATE POLICY "images_all"    ON public.room_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid())
);

-- Favorites
CREATE POLICY "favs_select" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favs_insert" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favs_delete" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- ---- STORAGE BUCKET ----
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'room-images');
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-images' AND auth.role() = 'authenticated');
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE USING (bucket_id = 'room-images' AND auth.role() = 'authenticated');
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE USING (bucket_id = 'room-images' AND auth.role() = 'authenticated');

-- =============================================
-- DONE!
-- 
-- If you have EXISTING USERS whose profile row is missing, run this to fix them:
--
--   INSERT INTO public.users (id, email, full_name, role)
--   SELECT id, email,
--     COALESCE(raw_user_meta_data->>'full_name', split_part(email,'@',1)),
--     COALESCE(raw_user_meta_data->>'role', 'citizen')
--   FROM auth.users
--   ON CONFLICT (id) DO UPDATE
--     SET role = EXCLUDED.role
--     WHERE public.users.role = 'citizen';
--
-- To make yourself admin after signing up:
--   UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
-- =============================================
