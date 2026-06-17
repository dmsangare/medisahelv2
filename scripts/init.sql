-- =====================================================================
-- CLINIQUE CENTRALE MÉDISAHEL MALI - ERP ARCHITECTURE SQL DATABASE SCRIPT
-- FILE: scripts/init.sql
-- DESCRIPTION: Base DDL installation script for PostgreSQL 14+ / 16+.
-- AUTHOR: Adama SANGARÉ / IT Engineering MédiSahel Clinique
-- DATE: 2026-06-17
-- =====================================================================

-- Enable necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define custom enum types (mirrored from Prisma / application specifications)
CREATE TYPE "Role" AS ENUM (
  'ADMIN',
  'DOCTOR',
  'NURSE',
  'CASHIER',
  'PHARMACIST',
  'LAB_TECH',
  'HR',
  'MEDECIN_GENERAL_CHIEF',
  'STAGIAIRE',
  'AIDE_SOIGNANT',
  'CAISSIER_PHARMACIEN',
  'GESTIONNAIRE_STOCK'
);

CREATE TYPE "HospitalizationStatus" AS ENUM (
  'ADMITTED',
  'DISCHARGED'
);

CREATE TYPE "TransactionStatus" AS ENUM (
  'PAID',
  'UNPAID',
  'PARTIAL'
);

CREATE TYPE "TransactionType" AS ENUM (
  'INVOICE',
  'PAYMENT'
);

CREATE TYPE "LabStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'VALIDATED',
  'CANCELLED'
);

CREATE TYPE "AttendanceStatus" AS ENUM (
  'PRESENT',
  'LATE',
  'ABSENT'
);

CREATE TYPE "PayrollStatus" AS ENUM (
  'PAID',
  'PENDING'
);

CREATE TYPE "AppointmentStatus" AS ENUM (
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED'
);

-- ==========================================
-- 1. CLINIC MODEL
-- ==========================================
CREATE TABLE "Clinic" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "logoUrl" TEXT,
  "address" TEXT,
  "currency" VARCHAR(50) DEFAULT 'FCFA' NOT NULL,
  "themeColor" VARCHAR(50) DEFAULT '#0f766e' NOT NULL,
  "slogan" TEXT,
  "city" VARCHAR(100),
  "country" VARCHAR(100),
  "phone" VARCHAR(100),
  "whatsapp" VARCHAR(100),
  "email" VARCHAR(255),
  "website" VARCHAR(255),
  "licenseNumber" VARCHAR(255),
  "rccm" VARCHAR(255),
  "ifuNif" VARCHAR(255),
  "digitalStamp" TEXT,
  "instSignature" TEXT,
  "faviconUrl" TEXT,
  "secondaryColor" VARCHAR(50) DEFAULT '#2E8B57',
  "accentColor" VARCHAR(50) DEFAULT '#E67E22',
  "bgColor" VARCHAR(50) DEFAULT '#F5F5F5',
  "textColor" VARCHAR(50) DEFAULT '#333333',
  "clinicalStamp" TEXT,
  "pdfHeader" TEXT,
  "pdfFooter" TEXT,
  "timezone" VARCHAR(100) DEFAULT 'Afrique/Bamako',
  "dateFormat" VARCHAR(100) DEFAULT 'DD/MM/YYYY',
  "timeFormat" VARCHAR(100) DEFAULT 'HH:MM',
  "mainLanguage" VARCHAR(100) DEFAULT 'Français',
  "secondLanguage" VARCHAR(100) DEFAULT 'Bambara',
  "departmentsList" TEXT,
  "servicesList" TEXT,
  "ethniesList" TEXT,
  "nationalitiesList" TEXT,
  "analysisTypesList" TEXT,
  "medicamentsList" TEXT,
  "suppliersList" TEXT,
  "delayReasonsList" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. USER MODEL
-- ==========================================
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "role" "Role" DEFAULT 'DOCTOR' NOT NULL,
  "mustChangePassword" BOOLEAN DEFAULT TRUE NOT NULL,
  "clinicId" UUID NOT NULL,
  "status" VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. PATIENT MODEL
-- ==========================================
CREATE TABLE "Patient" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "nationalId" VARCHAR(255) UNIQUE NOT NULL,
  "dateOfBirth" VARCHAR(100) NOT NULL,
  "gender" VARCHAR(10) DEFAULT 'M' NOT NULL,
  "phone" VARCHAR(100),
  "email" VARCHAR(255),
  "bloodType" VARCHAR(20),
  "allergies" TEXT,
  "address" TEXT,
  "ethnie" VARCHAR(100) DEFAULT 'Non renseignée' NOT NULL,
  "nationalite" VARCHAR(100) DEFAULT 'Non renseignée' NOT NULL,
  "maritalStatus" VARCHAR(50),
  "profession" VARCHAR(100),
  "language" VARCHAR(100),
  "commune" VARCHAR(100),
  "quartier" VARCHAR(100),
  "emergencyContact" VARCHAR(255),
  "nina" VARCHAR(100),
  "amo" VARCHAR(100),
  "inps" VARCHAR(100),
  "status" VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. MEDICAL RECORD MODEL
-- ==========================================
CREATE TABLE "MedicalRecord" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID NOT NULL,
  "doctorId" UUID NOT NULL,
  "doctorName" VARCHAR(255) NOT NULL,
  "symptoms" TEXT NOT NULL,
  "diagnosis" TEXT NOT NULL,
  "prescription" TEXT NOT NULL,
  "notes" TEXT,
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. ROOM & BED MODELS
-- ==========================================
CREATE TABLE "Room" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "number" VARCHAR(100) UNIQUE NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "service" VARCHAR(100) NOT NULL,
  "floor" VARCHAR(50) NOT NULL,
  "capacity" INTEGER DEFAULT 2 NOT NULL,
  "status" VARCHAR(100) DEFAULT 'Disponible' NOT NULL,
  "allowedGender" VARCHAR(100) DEFAULT 'Mixte' NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Bed" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "number" VARCHAR(100) UNIQUE NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "roomId" UUID NOT NULL,
  "status" VARCHAR(100) DEFAULT 'Disponible' NOT NULL,
  "patientId" UUID,
  "patientNom" VARCHAR(255),
  "dateAdmission" VARCHAR(100),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "BedHistory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "bedId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "patientName" VARCHAR(255) NOT NULL,
  "startDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP,
  "action" VARCHAR(100) NOT NULL, -- ADMISSION, TRANSFER, DISCHARGE, MAINTENANCE
  "notes" TEXT
);

-- ==========================================
-- 6. HOSPITALIZATION MODEL
-- ==========================================
CREATE TABLE "Hospitalization" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID NOT NULL,
  "bedNumber" VARCHAR(100) NOT NULL,
  "roomNumber" VARCHAR(100) NOT NULL,
  "admissionDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dischargeDate" TIMESTAMP,
  "reason" TEXT NOT NULL,
  "status" "HospitalizationStatus" DEFAULT 'ADMITTED' NOT NULL,
  "notes" TEXT,
  "roomId" UUID,
  "bedId" UUID,
  "roomType" VARCHAR(100),
  "bedType" VARCHAR(100),
  "roomPrice" DOUBLE PRECISION,
  "bedPrice" DOUBLE PRECISION,
  "transfers" JSONB
);

-- ==========================================
-- 7. TRANSACTION MODEL (BILLING / CASHIER)
-- ==========================================
CREATE TABLE "Transaction" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID NOT NULL,
  "type" "TransactionType" DEFAULT 'INVOICE' NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" "TransactionStatus" DEFAULT 'UNPAID' NOT NULL,
  "cashierId" UUID NOT NULL,
  "cashierName" VARCHAR(255) NOT NULL,
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentMethod" VARCHAR(100) DEFAULT 'CASH' NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. LAB TEST MODEL
-- ==========================================
CREATE TABLE "LabTest" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID NOT NULL,
  "testName" VARCHAR(255) NOT NULL,
  "category" VARCHAR(100) DEFAULT 'BLOOD' NOT NULL,
  "status" "LabStatus" DEFAULT 'PENDING' NOT NULL,
  "results" TEXT,
  "requestedBy" VARCHAR(255) NOT NULL,
  "performedBy" VARCHAR(255),
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. ATTENDANCE & PAYROLL (Ressources Humaines)
-- ==========================================
CREATE TABLE "Attendance" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "date" VARCHAR(100) NOT NULL, -- YYYY-MM-DD
  "checkIn" VARCHAR(50),
  "checkOut" VARCHAR(50),
  "status" "AttendanceStatus" DEFAULT 'PRESENT' NOT NULL,
  "reason" TEXT
);

CREATE TABLE "Payroll" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "baseSalary" DOUBLE PRECISION NOT NULL,
  "bonuses" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "deductions" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "netSalary" DOUBLE PRECISION NOT NULL,
  "status" "PayrollStatus" DEFAULT 'PENDING' NOT NULL,
  "payDate" TIMESTAMP
);

-- ==========================================
-- 10. APPOINTMENT MODEL
-- ==========================================
CREATE TABLE "Appointment" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID NOT NULL,
  "doctorId" UUID NOT NULL,
  "doctorName" VARCHAR(255) NOT NULL,
  "date" VARCHAR(100) NOT NULL,
  "time" VARCHAR(100) NOT NULL,
  "status" "AppointmentStatus" DEFAULT 'CONFIRMED' NOT NULL,
  "notes" TEXT
);

-- ==========================================
-- 11. DOCUMENT ARCHIVES (GECD)
-- ==========================================
CREATE TABLE "Document" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "fileUrl" TEXT,
  "fileType" VARCHAR(50) DEFAULT 'PDF' NOT NULL,
  "category" VARCHAR(100) DEFAULT 'INCOMING' NOT NULL,
  "ownerId" UUID NOT NULL,
  "ownerName" VARCHAR(255) NOT NULL,
  "size" VARCHAR(100) DEFAULT '0 KB' NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 12. AUDIT LOGS
-- ==========================================
CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" VARCHAR(255) NOT NULL,
  "userName" VARCHAR(255) NOT NULL,
  "role" VARCHAR(255) NOT NULL,
  "action" VARCHAR(255) NOT NULL,
  "details" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 13. HOSPITALIZATION & BED RATES
-- ==========================================
CREATE TABLE "HospitalizationRate" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "roomType" VARCHAR(100) UNIQUE NOT NULL,
  "price" DOUBLE PRECISION NOT NULL
);

CREATE TABLE "BedRate" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "bedType" VARCHAR(100) UNIQUE NOT NULL,
  "price" DOUBLE PRECISION NOT NULL
);

CREATE TABLE "TransferLog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID NOT NULL,
  "patientNom" VARCHAR(255) NOT NULL,
  "hospitalizationId" UUID NOT NULL,
  "fromRoomNumber" VARCHAR(100) NOT NULL,
  "fromBedNumber" VARCHAR(100) NOT NULL,
  "toRoomNumber" VARCHAR(100) NOT NULL,
  "toBedNumber" VARCHAR(100) NOT NULL,
  "reason" TEXT,
  "userId" UUID,
  "userName" VARCHAR(255),
  "userRole" VARCHAR(100),
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 14. PHARMACY PRODUCT, LOT & ADJUSTMENTS (FEFO)
-- ==========================================
CREATE TABLE "PharmacyProduct" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "codeInterne" VARCHAR(100) UNIQUE NOT NULL,
  "codeBarre" VARCHAR(100) NOT NULL,
  "dci" VARCHAR(255) NOT NULL,
  "nomCommercial" VARCHAR(255) NOT NULL,
  "forme" VARCHAR(100),
  "dosage" VARCHAR(100),
  "category" VARCHAR(100),
  "supplier" VARCHAR(255),
  "priceAchat" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "priceVente" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "stockMin" INTEGER DEFAULT 10 NOT NULL,
  "stockMax" INTEGER DEFAULT 500 NOT NULL,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PharmacyLot" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID NOT NULL,
  "lotNumber" VARCHAR(100) NOT NULL,
  "dateFabrication" VARCHAR(100),
  "datePeremption" VARCHAR(100) NOT NULL,
  "qtyRecue" INTEGER NOT NULL,
  "qtyRemainingDepot" INTEGER NOT NULL,
  "qtyRemainingOfficine" INTEGER NOT NULL,
  "supplier" VARCHAR(255),
  "priceAchat" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "attachmentName" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PharmacyTransfer" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID NOT NULL,
  "lotId" UUID NOT NULL,
  "quantity" INTEGER NOT NULL,
  "userId" UUID NOT NULL,
  "userName" VARCHAR(255) NOT NULL,
  "status" VARCHAR(100) DEFAULT 'APPROVED' NOT NULL,
  "slipUrl" TEXT,
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PharmacySale" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID,
  "patientName" VARCHAR(255) DEFAULT 'Client Anonyme' NOT NULL,
  "cashierId" UUID NOT NULL,
  "cashierName" VARCHAR(255) NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "discount" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "insuranceContribution" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "amountPaid" DOUBLE PRECISION NOT NULL,
  "paymentMethod" VARCHAR(100) DEFAULT 'CASH' NOT NULL,
  "items" JSONB NOT NULL,
  "auditToken" VARCHAR(255),
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PharmacySupplier" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "contactName" VARCHAR(255),
  "phone" VARCHAR(100),
  "email" VARCHAR(255),
  "address" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PharmacyAdjustment" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID NOT NULL,
  "lotId" UUID NOT NULL,
  "type" VARCHAR(100) NOT NULL, -- CASSE, VOL, PERTE, AJUSTEMENT
  "qtyBefore" INTEGER NOT NULL,
  "qtyAfter" INTEGER NOT NULL,
  "difference" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "userId" UUID NOT NULL,
  "userName" VARCHAR(255) NOT NULL,
  "targetStore" VARCHAR(100) DEFAULT 'OFFICINE' NOT NULL,
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PharmacyAlert" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID,
  "productName" VARCHAR(255),
  "type" VARCHAR(100) NOT NULL,
  "details" TEXT NOT NULL,
  "status" VARCHAR(100) DEFAULT 'ACTIVE' NOT NULL,
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PharmacyPrescription" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID NOT NULL,
  "patientName" VARCHAR(255) NOT NULL,
  "doctorName" VARCHAR(255) NOT NULL,
  "prescriptionText" TEXT NOT NULL,
  "status" VARCHAR(100) DEFAULT 'PENDING' NOT NULL,
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "servedAt" VARCHAR(100),
  "dispensedBy" VARCHAR(255),
  "medications" JSONB NOT NULL,
  "dispensedMedications" JSONB
);

CREATE TABLE "PharmacyInventory" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "type" VARCHAR(100) NOT NULL, -- ANNUEL, TOURNANT
  "date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responsibleSignature" TEXT NOT NULL,
  "userName" VARCHAR(255) NOT NULL,
  "discrepancyReport" JSONB NOT NULL,
  "status" VARCHAR(100) DEFAULT 'COMPLETED' NOT NULL
);

-- ==========================================
-- 15. DMG MOVEMENT, SHIFTS, STAFF
-- ==========================================
CREATE TABLE "DmgStaff" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID UNIQUE NOT NULL,
  "teamName" VARCHAR(100) DEFAULT 'Non assigne' NOT NULL,
  "status" VARCHAR(100) DEFAULT 'ACTIVE' NOT NULL,
  "availability" VARCHAR(100) DEFAULT 'AVAILABLE' NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DmgGuardPlanning" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "shiftType" VARCHAR(100) NOT NULL, -- MATIN, APRES_MIDI, NUIT
  "date" VARCHAR(100) NOT NULL,
  "responsibleId" UUID NOT NULL,
  "responsibleName" VARCHAR(255) NOT NULL,
  "referentDocId" UUID NOT NULL,
  "referentDocName" VARCHAR(255) NOT NULL,
  "staffIdsAndNames" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DmgDelegatedCare" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID NOT NULL,
  "patientName" VARCHAR(255) NOT NULL,
  "roomNumber" VARCHAR(100) DEFAULT 'N/A' NOT NULL,
  "bedNumber" VARCHAR(100) DEFAULT 'N/A' NOT NULL,
  "careType" VARCHAR(100) NOT NULL,
  "description" TEXT NOT NULL,
  "priority" VARCHAR(100) DEFAULT 'MEDIUM' NOT NULL,
  "prescriberId" UUID NOT NULL,
  "prescriberName" VARCHAR(255) NOT NULL,
  "agentId" UUID,
  "agentName" VARCHAR(255),
  "scheduledTime" VARCHAR(50) NOT NULL,
  "executedTime" VARCHAR(50),
  "date" VARCHAR(100) NOT NULL,
  "status" VARCHAR(100) DEFAULT 'PENDING' NOT NULL,
  "observations" TEXT,
  "logs" TEXT,
  "difficultyAlert" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DmgShiftHandover" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "fromShift" VARCHAR(100) NOT NULL,
  "toShift" VARCHAR(100) NOT NULL,
  "date" VARCHAR(100) NOT NULL,
  "senderName" VARCHAR(255) NOT NULL,
  "criticalCases" TEXT NOT NULL,
  "pendingCares" TEXT NOT NULL,
  "pendingLabs" TEXT NOT NULL,
  "incidents" TEXT NOT NULL,
  "status" VARCHAR(100) DEFAULT 'TRANSMITTED' NOT NULL,
  "validatedBy" VARCHAR(255),
  "validatedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DmgMainCouranteEntry" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "category" VARCHAR(100) NOT NULL,
  "author" VARCHAR(255) NOT NULL,
  "details" TEXT NOT NULL,
  "date" VARCHAR(100) NOT NULL,
  "time" VARCHAR(100) NOT NULL,
  "service" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ClinicalVersion" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" UUID NOT NULL,
  "previousContent" TEXT NOT NULL,
  "newContent" TEXT NOT NULL,
  "authorId" UUID NOT NULL,
  "authorName" VARCHAR(255) NOT NULL,
  "authorRole" VARCHAR(100) NOT NULL,
  "reason" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "MedicalLibraryItem" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "trigger" VARCHAR(100) UNIQUE NOT NULL,
  "label" VARCHAR(255) NOT NULL,
  "text" TEXT NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 16. CAMPAIGN, CONTACTS, EMAILS, MESSAGES
-- ==========================================
CREATE TABLE "Contact" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "lastName" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(100),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "category" VARCHAR(100) NOT NULL, -- PATIENTS, PERSONNEL, FOURNISSEURS, ASSURANCES
  "status" VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ContactGroup" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Join table for Contact <=> ContactGroup Many-to-Many relationship
CREATE TABLE "_ContactGroupContacts" (
  "A" UUID NOT NULL,
  "B" UUID NOT NULL
);

CREATE UNIQUE INDEX "_ContactGroupContacts_AB_unique" ON "_ContactGroupContacts"("A", "B");
CREATE INDEX "_ContactGroupContacts_B_index" ON "_ContactGroupContacts"("B");

CREATE TABLE "EmailTemplate" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "EmailCampaign" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "body" TEXT NOT NULL,
  "targetGroup" VARCHAR(100) NOT NULL,
  "sentCount" INTEGER DEFAULT 0 NOT NULL,
  "openCount" INTEGER DEFAULT 0 NOT NULL,
  "failCount" INTEGER DEFAULT 0 NOT NULL,
  "status" VARCHAR(50) DEFAULT 'DRAFT' NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "EmailLog" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recipientName" VARCHAR(255) NOT NULL,
  "recipientEmail" VARCHAR(255) NOT NULL,
  "category" VARCHAR(100) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "body" TEXT NOT NULL,
  "status" VARCHAR(50) DEFAULT 'SENT' NOT NULL,
  "senderName" VARCHAR(255) NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "EmailRecipient" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "campaignId" UUID NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
  "sentAt" TIMESTAMP
);

CREATE TABLE "DmeArchive" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "patientId" UUID NOT NULL,
  "actionType" VARCHAR(100) NOT NULL,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" UUID,
  "content" TEXT NOT NULL,
  "performedBy" VARCHAR(255) NOT NULL,
  "performedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" VARCHAR(100) DEFAULT '127.0.0.1',
  "userAgent" VARCHAR(255) DEFAULT 'WebBrowser'
);

-- ==========================================
-- FOREIGN KEY CONSTRAINTS (Ensuring physical integrity)
-- ==========================================
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BedHistory" ADD CONSTRAINT "BedHistory_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ContactGroupContacts" ADD CONSTRAINT "_ContactGroupContacts_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ContactGroupContacts" ADD CONSTRAINT "_ContactGroupContacts_B_fkey" FOREIGN KEY ("B") REFERENCES "ContactGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- ELEGANT & COMPREHENSIVE PERFORMANCE INDEXES
-- ==========================================
CREATE INDEX "idx_patient_national_id" ON "Patient"("nationalId");
CREATE INDEX "idx_user_email" ON "User"("email");
CREATE INDEX "idx_medical_record_patient_id" ON "MedicalRecord"("patientId");
CREATE INDEX "idx_transaction_patient_id" ON "Transaction"("patientId");
CREATE INDEX "idx_pharmacy_lot_expiry" ON "PharmacyLot"("datePeremption");
CREATE INDEX "idx_pharmacy_lot_product" ON "PharmacyLot"("productId");
CREATE INDEX "idx_dmg_care_patient" ON "DmgDelegatedCare"("patientId");
CREATE INDEX "idx_dmg_care_date" ON "DmgDelegatedCare"("date");
CREATE INDEX "idx_lab_test_patient" ON "LabTest"("patientId");
CREATE INDEX "idx_appointment_date" ON "Appointment"("date");
CREATE INDEX "idx_audit_log_timestamp" ON "AuditLog"("timestamp" DESC);
