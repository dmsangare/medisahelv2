import crypto from "crypto";
import fs from "fs";
import path from "path";

const ENCRYPTION_KEY_STRING = process.env.JWT_SECRET || "medishahel_aes_secret_fallback_key_64_characters_long_minimum_required_for_aes";
const KEY = crypto.scryptSync(ENCRYPTION_KEY_STRING, "medishahel_salt_2026", 32); // Derived 256-bit safe key
const IV_LENGTH = 12; // 12 bytes for GCM mode

/**
 * Encrypts a buffer using AES-256-GCM
 */
export function encryptBuffer(data: Buffer): { iv: string; encrypted: string; tag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return {
    iv: iv.toString("hex"),
    encrypted: encrypted.toString("hex"),
    tag: tag.toString("hex")
  };
}

/**
 * Decrypts AES-256-GCM encrypted payload
 */
export function decryptBuffer(payload: { iv: string; encrypted: string; tag: string }): Buffer {
  const iv = Buffer.from(payload.iv, "hex");
  const encrypted = Buffer.from(payload.encrypted, "hex");
  const tag = Buffer.from(payload.tag, "hex");
  
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Clinical Backup Utility: Automatically encrypts local critical file data
 */
export function secureLocalBackupFile(srcFilename: string, destFilename: string): boolean {
  try {
    const dataPath = path.join(process.cwd(), "data", srcFilename);
    const destPath = path.join(process.cwd(), "data", destFilename);
    
    if (!fs.existsSync(dataPath)) {
      console.warn(`[AES Backup Engine] Fichier source introuvable: ${srcFilename}`);
      return false;
    }
    
    const rawContent = fs.readFileSync(dataPath);
    const encryptedResult = encryptBuffer(rawContent);
    
    fs.writeFileSync(destPath, JSON.stringify(encryptedResult, null, 2), "utf-8");
    console.log(`[AES Backup Engine] Securisation terminée. Le fichier ${srcFilename} a été chiffré en AES-256-GCM sous ${destFilename}`);
    return true;
  } catch (err: any) {
    console.error("[AES Backup Engine] Échec durant le chiffrement de sauvegarde:", err.message);
    return false;
  }
}

// Running standalone demonstration if called directly
if (require.main === module) {
  console.log("[AES Backup Engine] Démarrage autonome d'audit sécurité de sauvegarde...");
  const testFileSrc = "patients.json";
  const testFileDest = "patients.json.enc";
  secureLocalBackupFile(testFileSrc, testFileDest);
}
