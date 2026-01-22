
import sqlite3
import os
from nanoid import generate

def simulate_telegram_link():
    db_path = '/home/ubuntu/Testes/data/detector.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Criar a tabela de evidências no SQLite
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS evidence_storage (
        id TEXT PRIMARY KEY,
        politician_id TEXT,
        analysis_id TEXT,
        telegram_file_id TEXT NOT NULL,
        file_type TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(politician_id) REFERENCES politicians(id)
    )
    ''')
    
    # 2. Buscar o ID do Nikolas Ferreira
    cursor.execute("SELECT id FROM politicians WHERE name = 'Nikolas Ferreira'")
    nikolas = cursor.fetchone()
    
    if not nikolas:
        print("❌ Nikolas Ferreira não encontrado no banco.")
        return
    
    nikolas_id = nikolas[0]
    
    # 3. Simular o "Upload" para o Telegram
    # Imagine que enviamos um print de um post do Nikolas para o Bot
    fake_telegram_file_id = "AgACAgEAAxkBAAEJ..." # ID real que o Telegram retornaria
    evidence_id = generate()
    
    cursor.execute('''
    INSERT INTO evidence_storage (id, politician_id, telegram_file_id, file_type, description)
    VALUES (?, ?, ?, ?, ?)
    ''', (evidence_id, nikolas_id, fake_telegram_file_id, 'image', 'Print de post no X prometendo fiscalização de verbas em MG'))
    
    conn.commit()
    
    print(f"--- 'Gambiarra' do Telegram Concluída ---")
    print(f"✅ Prova vinculada ao Nikolas Ferreira (ID: {nikolas_id})")
    print(f"📂 Telegram File ID: {fake_telegram_file_id}")
    print(f"📝 Descrição: Print de post no X prometendo fiscalização de verbas em MG")
    print(f"\nComo funciona a recuperação:")
    print(f"Quando o usuário clica em 'Ver Prova', o sistema faz: bot.getFileLink('{fake_telegram_file_id}')")
    
    conn.close()

if __name__ == "__main__":
    simulate_telegram_link()
