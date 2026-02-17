-- Add UPDATE policy for tenants
CREATE POLICY "Tenants can be updated by their owners"
  ON tenants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
