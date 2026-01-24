import { analisarIncoerencia, Vote } from '../server/integrations/camara.js';

async function demo() {
  console.log('--- Demonstração do Detector de Incoerência (Diz vs Faz) ---');

  const promessas = [
    {
      texto: "Vou lutar para aumentar o investimento em educação pública e garantir merenda de qualidade.",
      tema: "Educação"
    },
    {
      texto: "Minha prioridade será reduzir a carga tributária para pequenos empreendedores.",
      tema: "Economia"
    }
  ];

  const votosSimulados: Vote[] = [
    {
      idVotacao: "2400001",
      data: "2024-05-20T14:30:00",
      proposicao: "PL 1234/2024",
      voto: "Não",
      ementa: "Altera a Lei de Diretrizes Orçamentárias para reduzir repasses destinados à merenda escolar nos municípios."
    },
    {
      idVotacao: "2400002",
      data: "2024-06-15T10:00:00",
      proposicao: "PEC 45/2024",
      voto: "Sim",
      ementa: "Institui a reforma tributária e simplifica a cobrança de impostos sobre o consumo."
    }
  ];

  promessas.forEach(p => {
    console.log(`\nPromessa Detectada: "${p.texto}"`);
    votosSimulados.forEach(v => {
      const analise = analisarIncoerencia(p.texto, v);
      if (analise.incoerente) {
        console.log(`❌ ALERTA DE INCOERÊNCIA DETECTADO!`);
        console.log(`Voto: ${v.voto} na proposição ${v.proposicao}`);
        console.log(`Ementa: ${v.ementa}`);
        console.log(`Justificativa: ${analise.justificativa}`);
      } else {
        console.log(`✅ Coerência mantida para o voto na proposição ${v.proposicao}`);
      }
    });
  });
}

demo();
