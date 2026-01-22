
import sqlite3
import json

def test_search(query):
    db_path = '/home/ubuntu/Testes/data/detector.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print(f"--- Testando busca por: '{query}' ---")
    
    # Busca em políticos
    sql = "SELECT * FROM politicians WHERE name LIKE ? OR party LIKE ? OR region LIKE ?"
    params = (f'%{query}%', f'%{query}%', f'%{query}%')
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    
    results = [dict(row) for row in rows]
    print(json.dumps(results, indent=2, ensure_ascii=False))
    
    conn.close()

if __name__ == "__main__":
    test_search("Nikolas")
    test_search("PL")
    test_search("MG")
