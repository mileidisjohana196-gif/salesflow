const { exec } = require('child_process');
const fs = require('fs');

// Database connection details for AppSalesFlow
const DB_HOST = 'aws-0-sa-east-1.pooler.supabase.com';
const DB_PORT = 6543;
const DB_USER = 'postgres.fbdjeggrvoplweldfncz';
const DB_PASSWORD = process.argv[2]; // Pass as argument
const DB_NAME = 'postgres';

if (!DB_PASSWORD) {
  console.log('Uso: node apply-schema.js <database-password>');
  console.log('Encontrá la password en: Supabase Dashboard → Settings → Database → Connection string → Pooler');
  process.exit(1);
}

const sql = fs.readFileSync('db/schema.sql', 'utf8');

const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require`;

const query = `psql "${connectionString}" -c "${sql.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;

console.log('Aplicando schema a AppSalesFlow...');
exec(query, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  if (stderr) {
    console.error('Stderr:', stderr);
  }
  console.log('Output:', stdout);
  console.log('✅ Schema aplicado correctamente');
});
