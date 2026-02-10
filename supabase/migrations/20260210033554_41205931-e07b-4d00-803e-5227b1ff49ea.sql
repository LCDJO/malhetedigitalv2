-- First migration: only add enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'administrador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consulta';