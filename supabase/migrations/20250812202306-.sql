-- Remove public read access on sensitive financial data
-- Fix: Drop blanket SELECT policy on Estados de pago

DROP POLICY IF EXISTS "Enable read access for all users" ON public."Estados de pago";