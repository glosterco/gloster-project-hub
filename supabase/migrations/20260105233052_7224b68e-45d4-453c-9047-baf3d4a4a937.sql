-- Allow public UPDATE on RFI table for status changes via edge function
CREATE POLICY "Allow public update RFI status"
ON public."RFI"
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public UPDATE on rfi_messages if needed
CREATE POLICY "Allow public update to rfi_messages"
ON public.rfi_messages
FOR UPDATE
USING (true)
WITH CHECK (true);