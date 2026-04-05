
CREATE TABLE public.licitacion_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  licitacion_id bigint NOT NULL REFERENCES public."Licitaciones"(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.licitacion_otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert OTP" ON public.licitacion_otp_codes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public select OTP" ON public.licitacion_otp_codes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public update OTP" ON public.licitacion_otp_codes
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_otp_lookup ON public.licitacion_otp_codes (licitacion_id, email, code, used);
