// Migration : ajoute les colonnes de référence photo sur la table couleurs
import 'dotenv/config';
import pool from '../db.js';

let conn;
try {
  conn = await pool.getConnection();

  await conn.query(`
    ALTER TABLE couleurs
      ADD COLUMN hex_photo CHAR(7)          NULL AFTER hex,
      ADD COLUMN r_photo   TINYINT UNSIGNED NULL AFTER b,
      ADD COLUMN g_photo   TINYINT UNSIGNED NULL AFTER r_photo,
      ADD COLUMN b_photo   TINYINT UNSIGNED NULL AFTER g_photo
  `);

  console.log('✓ Colonnes hex_photo / r_photo / g_photo / b_photo ajoutées.');
} catch (err) {
  if (err.code === 'ER_DUP_FIELDNAME') {
    console.log('— Colonnes déjà présentes, rien à faire.');
  } else {
    console.error('Erreur :', err.message);
    process.exit(1);
  }
} finally {
  if (conn) conn.release();
  await pool.end();
}
