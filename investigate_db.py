#!/usr/bin/env python3
import os
import json
from supabase import create_client, Client

SUPABASE_URL = "https://ceexfkjldhsbpugxvuyn.supabase.co"
SUPABASE_KEY = "sb_secret_xsvh_x1Zog0FPn7urshqbA_IoiXBxR8"

def investigate():
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"Conectado ao Supabase: {SUPABASE_URL}")
        
        tables = ['users', 'politicians', 'analyses', 'promises', 'audit_logs', 'consents', 'public_data_cache', 'evidence_storage']
        
        report = {}
        
        for table in tables:
            print(f"\n--- Investigando tabela: {table} ---")
            try:
                # Buscar os primeiros 10 registros
                response = supabase.table(table).select("*").limit(10).execute()
                data = response.data
                count = len(data)
                
                print(f"Registros encontrados: {count}")
                
                if count > 0:
                    # Verificar se há dados mockados (ex: nomes genéricos, emails de teste)
                    mock_indicators = ['test', 'mock', 'example', 'candidato', 'user@', 'foo', 'bar']
                    is_mocked = False
                    
                    sample_str = json.dumps(data).lower()
                    found_indicators = [ind for ind in mock_indicators if ind in sample_str]
                    
                    if found_indicators:
                        print(f"⚠️  Possíveis dados mockados detectados: {found_indicators}")
                        is_mocked = True
                    
                    report[table] = {
                        "count": count,
                        "is_mocked": is_mocked,
                        "indicators": found_indicators,
                        "sample": data[0] if data else None
                    }
                    
                    # Mostrar amostra formatada
                    print("Amostra do primeiro registro:")
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
                else:
                    report[table] = {"count": 0, "is_mocked": False}
                    
            except Exception as e:
                print(f"❌ Erro ao acessar tabela {table}: {str(e)}")
                report[table] = {"error": str(e)}

        # Salvar relatório
        with open('db_investigation_report.json', 'w') as f:
            json.dump(report, f, indent=2)
            
    except Exception as e:
        print(f"Erro fatal: {str(e)}")

if __name__ == "__main__":
    investigate()
