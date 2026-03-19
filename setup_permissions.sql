
-- ==========================================
-- SCRIPT DE PERMISSÃO TOTAL (ADMIN)
-- ==========================================

-- 1. Promover o usuário atual a Administrador
-- Substitua 'SEU_EMAIL_AQUI' pelo seu e-mail de login
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_AQUI'
);

-- 2. Garantir que Administradores possam ver/editar tudo em 'patients'
DROP POLICY IF EXISTS "Admins have full access to patients" ON patients;
CREATE POLICY "Admins have full access to patients" 
ON patients 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Garantir que Administradores possam ver/editar tudo em 'prescriptions'
DROP POLICY IF EXISTS "Admins have full access to prescriptions" ON prescriptions;
CREATE POLICY "Admins have full access to prescriptions" 
ON prescriptions 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Garantir que Administradores possam ver/editar tudo em 'medications'
DROP POLICY IF EXISTS "Admins have full access to medications" ON medications;
CREATE POLICY "Admins have full access to medications" 
ON medications 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Garantir que Administradores possam ver/editar tudo em 'clinics'
DROP POLICY IF EXISTS "Admins have full access to clinics" ON clinics;
CREATE POLICY "Admins have full access to clinics" 
ON clinics 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 6. Garantir que Administradores possam ver/editar tudo em 'evolutions'
DROP POLICY IF EXISTS "Admins have full access to evolutions" ON evolutions;
CREATE POLICY "Admins have full access to evolutions" 
ON evolutions 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
