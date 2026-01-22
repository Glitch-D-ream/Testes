
import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Testando conexão com:', connectionString?.replace(/:[^:@]+@/, ':****@'));
  
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    const res = await client.query('SELECT NOW()');
    console.log('Hora no servidor:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('❌ Erro na conexão:', err);
  } finally {
    await pool.end();
  }
}

testConnection();
