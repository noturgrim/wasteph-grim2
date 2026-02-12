import { db } from "../db/index.js";
import { systemSettingsTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "../utils/encryption.js";

/**
 * SettingsService - Manage system settings with encryption support
 */
class SettingsService {
  // Keys that should be encrypted
  ENCRYPTED_KEYS = ["smtp.password"];

  /**
   * Check if a key should be encrypted
   * @param {string} key
   * @returns {boolean}
   */
  _shouldEncrypt(key) {
    return this.ENCRYPTED_KEYS.includes(key);
  }

  /**
   * Get a setting by key
   * @param {string} key
   * @returns {Promise<Object|null>}
   */
  async getSetting(key) {
    const [setting] = await db
      .select()
      .from(systemSettingsTable)
      .where(eq(systemSettingsTable.key, key))
      .limit(1);

    if (!setting) return null;

    // Decrypt if needed
    if (setting.isEncrypted && setting.value) {
      return {
        ...setting,
        value: decrypt(setting.value),
      };
    }

    return setting;
  }

  /**
   * Get all SMTP settings
   * @returns {Promise<Object>}
   */
  async getSMTPSettings() {
    const keys = [
      "smtp.host",
      "smtp.port",
      "smtp.secure",
      "smtp.user",
      "smtp.password",
      "smtp.from_name",
    ];

    const settings = {};

    for (const key of keys) {
      const setting = await this.getSetting(key);
      if (setting) {
        const shortKey = key.replace("smtp.", "");
        settings[shortKey] = setting.value;
      }
    }

    return settings;
  }

  /**
   * Set or update a setting
   * @param {string} key
   * @param {string} value
   * @param {string} userId
   * @param {string} description
   * @returns {Promise<Object>}
   */
  async setSetting(key, value, userId, description = null) {
    const isEncrypted = this._shouldEncrypt(key);
    const finalValue = isEncrypted ? encrypt(value) : value;

    // Check if setting exists
    const existing = await db
      .select()
      .from(systemSettingsTable)
      .where(eq(systemSettingsTable.key, key))
      .limit(1);

    let result;

    if (existing.length > 0) {
      // Update existing
      [result] = await db
        .update(systemSettingsTable)
        .set({
          value: finalValue,
          isEncrypted,
          description: description || existing[0].description,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(systemSettingsTable.key, key))
        .returning();
    } else {
      // Create new
      [result] = await db
        .insert(systemSettingsTable)
        .values({
          key,
          value: finalValue,
          isEncrypted,
          description,
          updatedBy: userId,
        })
        .returning();
    }

    return result;
  }

  /**
   * Update SMTP settings
   * @param {Object} smtpData
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async updateSMTPSettings(smtpData, userId) {
    const settingsMap = {
      host: { key: "smtp.host", desc: "SMTP server hostname" },
      port: { key: "smtp.port", desc: "SMTP server port" },
      secure: { key: "smtp.secure", desc: "Use SSL/TLS" },
      user: { key: "smtp.user", desc: "SMTP authentication username" },
      password: { key: "smtp.password", desc: "SMTP authentication password" },
      from_name: { key: "smtp.from_name", desc: "Email sender name" },
    };

    const results = {};

    for (const [field, config] of Object.entries(settingsMap)) {
      if (smtpData[field] !== undefined) {
        const value = String(smtpData[field]);
        await this.setSetting(config.key, value, userId, config.desc);
        results[field] = value;
      }
    }

    return results;
  }

  /**
   * Delete a setting
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async deleteSetting(key) {
    const result = await db
      .delete(systemSettingsTable)
      .where(eq(systemSettingsTable.key, key))
      .returning();

    return result.length > 0;
  }

  /**
   * Get all settings (for super admin)
   * @returns {Promise<Array>}
   */
  async getAllSettings() {
    const settings = await db.select().from(systemSettingsTable);

    // Don't decrypt in list view, just indicate which are encrypted
    return settings.map((setting) => ({
      ...setting,
      value: setting.isEncrypted ? "***ENCRYPTED***" : setting.value,
    }));
  }
}

export default new SettingsService();
