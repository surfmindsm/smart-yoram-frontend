-- UPDATE 정책 추가
DROP POLICY IF EXISTS "Allow authenticated to update church applications" ON church_applications;

CREATE POLICY "Allow authenticated to update church applications"
ON church_applications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
