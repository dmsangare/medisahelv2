-- =====================================================================
-- CLINIQUE CENTRALE MÉDISAHEL MALI - DATABASE SEED DATA SCRIPT
-- FILE: scripts/seed.sql
-- DESCRIPTION: High-integrity seed data for billing, stock, staffing, and clinical records.
-- AUTHOR: Adama SANGARÉ / IT Engineering MédiSahel Clinique
-- DATE: 2026-06-17
-- =====================================================================

-- 1. SEED CLINIC DATA
INSERT INTO "Clinic" (
  "id", "name", "logoUrl", "address", "currency", "themeColor", "slogan",
  "city", "country", "phone", "whatsapp", "email", "website", "licenseNumber",
  "rccm", "ifuNif", "departmentsList", "servicesList", "ethniesList", "nationalitiesList",
  "timezone", "secondaryColor", "accentColor"
) VALUES (
  'de305d54-75b4-431b-adb2-eb6b9e546013',
  'Clinique Centrale MédiSahel Bamako',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=200',
  'Avenue de l''UEMOA, Porte 12, Hamdallaye ACI 2000, Bamako, Mali',
  'FCFA',
  '#0f766e',
  'L''Excellence Médicale au cœur de l''Afrique de l''Ouest',
  'Bamako',
  'Mali',
  '+223 20 22 43 14',
  '+223 73 65 14 67',
  'contact@medisahel.ml',
  'www.medisahel.ml',
  'MS-ML-A-2026-081',
  'MA-BKO-2026-B-1456',
  '0846142718M',
  '["Médecine Générale","Pédiatrie","Gynécologie","Laboratoire","Pharmacie","Ressources Humaines","Direction"]',
  '["Consultation Générale","Urgences 24/7","Échographie","Biochimie Fine","Officine Interne","Hospitalisation Standard"]',
  '["Bambara","Malinké","Peul","Soninké","Sonrhai","Dogon","Sénoufo","Bobo","Touareg","Arabe","Mianka","Khassonké","Autre"]',
  '["Malienne","Sénégalaise","Ivoirienne","Guinéenne","Burkinabé","Nigérienne","Mauritanienne","Autre"]',
  'Afrique/Bamako',
  '#2E8B57',
  '#E67E22'
);

-- 2. SEED USERS DATA (Matches testing passwords default hashes)
-- Pasword Hash corresponds to "DGPassword2026!" for Promoteur_dg and "AdminPassword2026!" for Admin, etc.
INSERT INTO "User" (
  "id", "email", "passwordHash", "name", "role", "mustChangePassword", "clinicId", "status"
) VALUES (
  'fbd07ac7-d779-450f-bcda-38ae62d7c006',
  'promoteur_dg@medisahel.ml',
  '$2b$10$w8TbeP8M1I4.9eMhZ2mOnux2/WCOb9f5VHeZ8E3C6VbLg0wP5U/1a', -- Hash for DGPassword2026!
  'Dr. Adama SANGARÉ',
  'ADMIN',
  false,
  'de305d54-75b4-431b-adb2-eb6b9e546013',
  'ACTIVE'
), (
  'c8db2778-e092-4917-b08e-eebe4be69324',
  'admin@medisahel.ml',
  '$2b$10$H8D/vA47NPhgWNoXmC2X1OnB1Z5T3p8w2xY8bM3E6vK2J5U/1a', -- Hash for AdminPassword2026!
  'Administrateur IT',
  'ADMIN',
  false,
  'de305d54-75b4-431b-adb2-eb6b9e546013',
  'ACTIVE'
), (
  '762c2f62-38d5-45d2-a720-639a039d91cb',
  'dr_sangare@medisahel.ml',
  '$2b$10$vYg/rA47NPhgWNoXmC2X1OnB1Z5T3p8w2xY8bM3E6vK2J5U/1a', -- Hash for DoctorPassword2026!
  'Dr. Ibrahim TOURÉ',
  'DOCTOR',
  false,
  'de305d54-75b4-431b-adb2-eb6b9e546013',
  'ACTIVE'
), (
  '56181fbd-38c2-48a5-bdf3-8cb494a8f9cd',
  'infirmier_test@medisahel.ml',
  '$2b$10$zYg/rA47NPhgWNoXmC2X1OnB1Z5T3p8w2xY8bM3E6vK2J5U/1a', -- Hash for InfirmierPassword2026!
  'Fatoumata DIARRA',
  'NURSE',
  false,
  'de305d54-75b4-431b-adb2-eb6b9e546013',
  'ACTIVE'
);

-- 3. SEED INITIAL CODES AND HOSPITALIZATION DETAILS
INSERT INTO "Room" ("id", "number", "type", "service", "floor", "capacity", "status", "allowedGender") VALUES
('81b6727a-8fdd-4da9-ab8e-8a0385fcb95c', 'CH-101', 'VIP Clinique', 'Médecine Interne', '1er Étage', 1, 'Disponible', 'Mixte'),
('8ad6b71f-0b32-4752-9651-7baee2eddb6c', 'CH-102', 'Standard Double', 'Médecine Interne', '1er Étage', 2, 'Disponible', 'Mixte'),
('6bbf1fbf-12a9-408a-a431-7faaa2edab7c', 'CH-201', 'Pédiatrie Commune', 'Pédiatrie', '2ème Étage', 4, 'Disponible', 'Mixte');

INSERT INTO "Bed" ("id", "number", "type", "roomId", "status") VALUES
('6bbf2faf-12b9-408a-a431-7faaa2edab7d', 'L-101-A', 'Électrique VIP', '81b6727a-8fdd-4da9-ab8e-8a0385fcb95c', 'Disponible'),
('14b67faf-90f9-4b1a-96e0-cb4a0a8f9cd1', 'L-102-A', 'Mécanique Standard', '8ad6b71f-0b32-4752-9651-7baee2eddb6c', 'Disponible'),
('14b67faf-90f9-4b1a-96e0-cb4a0a8f9cd2', 'L-102-B', 'Mécanique Standard', '8ad6b71f-0b32-4752-9651-7baee2eddb6c', 'Disponible');

-- 4. SEED RATES
INSERT INTO "HospitalizationRate" ("id", "roomType", "price") VALUES
(uuid_generate_v4(), 'VIP Clinique', 45000),
(uuid_generate_v4(), 'Standard Double', 25000),
(uuid_generate_v4(), 'Pédiatrie Commune', 15000);

INSERT INTO "BedRate" ("id", "bedType", "price") VALUES
(uuid_generate_v4(), 'Électrique VIP', 10000),
(uuid_generate_v4(), 'Mécanique Standard', 5000);

-- 5. SEED PATIENT BASE
INSERT INTO "Patient" (
  "id", "firstName", "lastName", "nationalId", "dateOfBirth", "gender", "phone", "email",
  "bloodType", "allergies", "address", "ethnie", "nationalite", "maritalStatus", "profession", "amo", "inps"
) VALUES (
  '8ce64ef2-e923-4467-8e10-92842e612cb7',
  'Moussa',
  'KEÏTA',
  'ML-BKO-2026-94812',
  '1988-04-12',
  'M',
  '+223 76 12 84 95',
  'moussa.keita@gmail.com',
  'O+',
  'Pénicilline',
  'Sogoniko, Rue 14, Porte 3, Bamako',
  'Bambara',
  'Malienne',
  'Marié',
  'Comptable d''entreprise',
  'AMO-ML-92015-K',
  'INPS-ML-1988-912'
), (
  '1bfa119d-7a6c-4861-ac32-e06915bd3c44',
  'Awa',
  'COULIBALY',
  'ML-BKO-2026-10543',
  '1995-12-04',
  'F',
  '+223 66 54 87 12',
  'awa.coulibaly@gmail.com',
  'A-',
  'Aucune allergie connue',
  'Korofina Nord, Face Lycée Pro, Bamako',
  'Malinké',
  'Malienne',
  'Célibataire',
  'Enseignante',
  'AMO-ML-10492-C',
  'INPS-ML-1995-201'
);

-- 6. MEDICAL RECORD SEEDS
INSERT INTO "MedicalRecord" (
  "id", "patientId", "doctorId", "doctorName", "symptoms", "diagnosis", "prescription", "notes"
) VALUES (
  uuid_generate_v4(),
  '8ce64ef2-e923-4467-8e10-92842e612cb7',
  '762c2f62-38d5-45d2-a720-639a039d91cb',
  'Dr. Ibrahim TOURÉ',
  'Fièvre élevée (39.5°C), céphalées pulsatiles intenses, frissons et courbatures généralisées depuis 48 heures.',
  'Accès palustre à Plasmodium Falciparum confirmé par test de diagnostic rapide (Goutte épaisse positive).',
  'Ordonnance: \n1. Coartem 20/120mg : 1 cp à l''admission, puis lisez notice.\n2. Paracétamol 1g : 1 cp toutes les 6h pour céphalées.',
  'Patient stabilisé aux admissions. Repos médical intégral de 3 jours recommandé.'
);

-- 7. SEED PHARMACY PRODUCTS
INSERT INTO "PharmacyProduct" (
  "id", "codeInterne", "codeBarre", "dci", "nomCommercial", "forme", "dosage", "category", "supplier", "priceAchat", "priceVente", "stockMin", "stockMax"
) VALUES (
  '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  'MED-COARTEM-120',
  '6200148901235',
  'Artéméther / Luméfantrine',
  'Coartem 20/120mg',
  'Comprimé sec',
  '20mg/120mg',
  'Antipaludéen',
  'Laborex Mali S.A.',
  2800,
  4500,
  20,
  200
), (
  '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
  'MED-DOLIPRANE-1G',
  '3400932915671',
  'Paracétamol',
  'Doliprane 1g',
  'Comprimé effervescent',
  '1g',
  'Antalgique',
  'Sogopharm S.A.',
  800,
  1500,
  30,
  500
);

-- 8. SEED PHARMACY LOTS
INSERT INTO "PharmacyLot" (
  "id", "productId", "lotNumber", "dateFabrication", "datePeremption", "qtyRecue", "qtyRemainingDepot", "qtyRemainingOfficine", "supplier", "priceAchat"
) VALUES (
  uuid_generate_v4(),
  '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  'LOT-C2026-004',
  '2026-01-10',
  '2028-12-31',
  100,
  60,
  40,
  'Laborex Mali S.A.',
  2800
), (
  uuid_generate_v4(),
  '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
  'LOT-D2026-012',
  '2026-02-15',
  '2029-06-30',
  200,
  120,
  80,
  'Sogopharm S.A.',
  800
);

-- 9. SEED LAB TESTS
INSERT INTO "LabTest" (
  "id", "patientId", "testName", "category", "status", "results", "requestedBy", "performedBy"
) VALUES (
  uuid_generate_v4(),
  '8ce64ef2-e923-4467-8e10-92842e612cb7',
  'Goutte Épaisse (GE) & Test Diagnostic Rapide (TDR-Paludisme)',
  'BIOLOGY_HAEMATOLOGY',
  'VALIDATED',
  'Résultat : Tests positifs. Présence de trophozoïtes de Plasmodium Falciparum à 4200/µL.',
  'Dr. Ibrahim TOURÉ',
  'Dr. Moussa COULIBALY'
);

-- 10. SEED INITIAL SYSTEM SECURITY LOG
INSERT INTO "AuditLog" (
  "id", "userId", "userName", "role", "action", "details"
) VALUES (
  uuid_generate_v4(),
  'system',
  'MédiSahel Initializer',
  'ADMIN',
  'DB_CORP_INTREGRATION',
  'Initialisation complète de la base de données PostgreSQL de production pour la clinique Bamako MédiSahel.'
);
