// db.js (Ayarlar için gerekli minimal veritabanı fonksiyonları)

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PGUSER,
        host: process.env.PGHOST,
            database: process.env.PGDATABASE,
                password: process.env.PGPASSWORD,
                    port: process.env.PGPORT,
                        ssl: { rejectUnauthorized: false }
                        });

                        async function createTable() {
                            try {
                                    await pool.connect();
                                            console.log("Veritabanına başarıyla bağlanıldı.");

                                                    const settingsQuery = `
                                                                CREATE TABLE IF NOT EXISTS settings (
                                                                                key TEXT PRIMARY KEY,
                                                                                                value TEXT NOT NULL
                                                                                                            );
                                                                                                                    `;
                                                                                                                            await pool.query(settingsQuery);
                                                                                                                                    console.log("Ayarlar tablosu başarıyla oluşturuldu.");

                                                                                                                                        } catch (error) {
                                                                                                                                                console.error("Veritabanı HATA: Tablolar oluşturulamadı.", error);
                                                                                                                                                    }
                                                                                                                                                    }

                                                                                                                                                    // -------------------- Ayar Temel Fonksiyonları --------------------

                                                                                                                                                    async function setSetting(key, value) {
                                                                                                                                                        try {
                                                                                                                                                                const query = `
                                                                                                                                                                            INSERT INTO settings (key, value)
                                                                                                                                                                                        VALUES ($1, $2)
                                                                                                                                                                                                    ON CONFLICT (key) DO UPDATE
                                                                                                                                                                                                                SET value = $2;
                                                                                                                                                                                                                        `;
                                                                                                                                                                                                                                await pool.query(query, [key, value]);
                                                                                                                                                                                                                                        return { success: true };
                                                                                                                                                                                                                                            } catch (error) {
                                                                                                                                                                                                                                                    return { success: false, message: error.message };
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                        async function getSetting(key) {
                                                                                                                                                                                                                                                            try {
                                                                                                                                                                                                                                                                    const query = 'SELECT value FROM settings WHERE key = $1';
                                                                                                                                                                                                                                                                            const result = await pool.query(query, [key]);
                                                                                                                                                                                                                                                                                    return result.rows.length > 0 ? result.rows[0].value : null;
                                                                                                                                                                                                                                                                                        } catch (error) {
                                                                                                                                                                                                                                                                                                console.error(`Veritabanı HATA: ${key} ayarı çekilemedi.`, error);
                                                                                                                                                                                                                                                                                                        return null;
                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                            }


                                                                                                                                                                                                                                                                                                            module.exports = {
                                                                                                                                                                                                                                                                                                                createTable,
                                                                                                                                                                                                                                                                                                                    setSetting,
                                                                                                                                                                                                                                                                                                                        getSetting,
                                                                                                                                                                                                                                                                                                                        };