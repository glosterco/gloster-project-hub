-- Add unique constraint for payment_id + approver_email to enable proper upsert
ALTER TABLE public.payment_approvals 
ADD CONSTRAINT payment_approvals_payment_email_unique 
UNIQUE (payment_id, approver_email);