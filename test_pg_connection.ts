import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.SUPABASE_DB_URL;

console.log('Testando conexão PostgreSQL direta...');
console.log('URL:', connectionString?.replace(/:[^:@]+@/, ':****@'));

const client = new Client({
  connectionString: connectionString,
});

async function test() {
  try {
    await client.connect();
    console.log('Conexão estabelecida com sucesso!');
    const res = await client.query('SELECT NOW()');
    console.log('Resultado da query:', res.rows[0]);
    await client.end();
  } catch (err: any) {
    console.error('Erro de conexão:', err.message);
    if (err.detail) console.error('Detalhe:', err.detail);
  }
}

test();
