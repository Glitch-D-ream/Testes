
import sqlite3
import os
from nanoid import generate

def seed_nikolas():
    db_path = '/home/ubuntu/Testes/data/detector.db'
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Criar tabela se não existir
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS politicians (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        party VARCHAR(50),
        office VARCHAR(100),
        region VARCHAR(100),
        tse_id VARCHAR(50),
        photo_url TEXT,
        bio TEXT,
        credibility_score REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Dados do Nikolas
    nikolas_id = generate()
    name = 'Nikolas Ferreira'
    party = 'PL'
    office = 'Deputado Federal'
    region = 'MG'
    tse_id = '209787'
    photo_url = 'https://www.camara.leg.br/internet/deputado/bandep/209787.jpg'
    bio = 'Deputado Federal mais votado do Brasil em 2022. Natural de Belo Horizonte, Minas Gerais.'
    credibility_score = 85.0
    
    # Inserir dados
    cursor.execute('''
    INSERT INTO politicians (id, name, party, office, region, tse_id, photo_url, bio, credibility_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (nikolas_id, name, party, office, region, tse_id, photo_url, bio, credibility_score))
    
    conn.commit()
    conn.close()
    print(f"✅ Nikolas Ferreira cadastrado com sucesso no SQLite via Python! ID: {nikolas_id}")

if __name__ == "__main__":
    seed_nikolas()
