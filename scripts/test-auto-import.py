
import sqlite3
import requests
import json

def test_auto_import(name):
    db_path = '/home/ubuntu/Testes/data/detector.db'
    print(f"--- Testando Auto-Importação para: '{name}' ---")
    
    # 1. Verificar se existe no banco
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM politicians WHERE name LIKE ?", (f'%{name}%',))
    exists = cursor.fetchone()
    conn.close()
    
    if exists:
        print(f"ℹ️ '{name}' já existe no banco local.")
    else:
        print(f"🔍 '{name}' não encontrado localmente. Simulando chamada à API da Câmara...")
        # Simula o que o ImportService faz
        resp = requests.get(f"https://dadosabertos.camara.leg.br/api/v2/deputados?nome={name}")
        data = resp.json()['dados']
        
        if data:
            p = data[0]
            print(f"✅ Encontrado na Câmara: {p['nome']} ({p['siglaPartido']}-{p['siglaUf']})")
            
            # Inserir no banco
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO politicians (id, name, party, office, region, tse_id, photo_url, bio, credibility_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                f"auto_{p['id']}", p['nome'], p['siglaPartido'], 'Deputado Federal', 
                p['siglaUf'], str(p['id']), p['urlFoto'], "Importado automaticamente via API.", 50.0
            ))
            conn.commit()
            conn.close()
            print(f"🚀 {p['nome']} foi IMPORTADO para o banco local automaticamente!")
        else:
            print("❌ Não encontrado nem na API da Câmara.")

if __name__ == "__main__":
    test_auto_import("Tabata Amaral")
