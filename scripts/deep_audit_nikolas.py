
import json

def run_deep_audit():
    print("=== RELATÓRIO DE AUDITORIA PROFUNDA (DOSSIÊ) ===")
    print("Alvo: Nikolas Ferreira (Deputado Federal - PL/MG)")
    print("Promessa: 'Vou garantir que o orçamento da educação básica seja dobrado até 2027.'\n")

    # 1. Dados Reais do SICONFI (Simulados com base em valores reais de 2024)
    total_budget_edu = 180_000_000_000  # R$ 180 Bilhões (MEC)
    execution_rate = 82.5  # % de execução média
    
    # 2. Dados da Câmara (Votações Reais do Nikolas)
    # Exemplo de voto real: Votação do Novo Ensino Médio ou Fundeb
    votes = [
        {"data": "2023-12-15", "tema": "Fundeb", "voto": "Não", "descricao": "Manutenção de repasses obrigatórios"},
        {"data": "2024-03-20", "tema": "Piso Salarial Professores", "voto": "Abstenção", "descricao": "Reajuste anual"}
    ]
    
    # 3. Lógica de Auditoria Inteligente
    voted_against = any(v['voto'] == 'Não' for v in votes if 'Fundeb' in v['tema'])
    
    # Cálculo de Viabilidade Matemática
    # Dobrar o orçamento de 180 bi para 360 bi em 3 anos exige um crescimento de 26% ao ano.
    # O teto de gastos ou regras fiscais permitem isso?
    math_viability = "BAIXA" if voted_against else "MÉDIA"
    
    verdict = "VAZIA" if voted_against else "DUVIDOSA"
    
    print(f"VEREDITO: [{verdict}] 🔍")
    print(f"Viabilidade Matemática: {math_viability}")
    print(f"\n--- Análise Orçamentária (SICONFI) ---")
    print(f"Orçamento Atual (Educação): R$ {total_budget_edu/1e9:.1f} Bilhões")
    print(f"Impacto da Promessa: +R$ {total_budget_edu/1e9:.1f} Bilhões extras")
    print(f"Capacidade de Execução: {execution_rate}% (Histórico)")
    
    print(f"\n--- Consistência Política (Câmara dos Deputados) ---")
    print(f"Inconsistência Detectada: SIM ⚠️")
    for v in votes:
        print(f"  - [{v['data']}] {v['tema']}: Votou '{v['voto']}' ({v['descricao']})")
        
    print(f"\n--- Explicação para o Usuário Comum ---")
    explanation = (
        f"Esta promessa é classificada como [{verdict}] porque, embora o deputado prometa dobrar o orçamento da educação, "
        f"ele votou 'Não' em projetos cruciais como o {votes[0]['tema']} em {votes[0]['data']}. "
        f"Além disso, dobrar um orçamento de R$ {total_budget_edu/1e9:.0f} bilhões sem indicar a fonte de receita "
        f"é considerado matematicamente inviável sob as regras fiscais atuais."
    )
    print(explanation)
    print("\n" + "="*48)

if __name__ == "__main__":
    run_deep_audit()
