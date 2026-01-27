import React, { useEffect, useRef, useState } from 'react';
import { Network, AlertCircle } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: 'politician' | 'company' | 'donor' | 'entity';
  size: number;
  color: string;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  type: 'financial' | 'political' | 'legal';
}

interface InfluenceGraphProps {
  nodes: Node[];
  edges: Edge[];
  politicianName: string;
}

export const InfluenceGraph: React.FC<InfluenceGraphProps> = ({
  nodes,
  edges,
  politicianName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamanho do canvas
    const rect = containerRef.current?.getBoundingClientRect();
    canvas.width = rect?.width || 800;
    canvas.height = rect?.height || 600;

    // Simular layout de força (força-dirigido simplificado)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const positions: Record<string, { x: number; y: number }> = {};

    // Posicionar nós em círculo ao redor do político central
    const centralNode = nodes.find((n) => n.label === politicianName);
    if (centralNode) {
      positions[centralNode.id] = { x: centerX, y: centerY };

      const otherNodes = nodes.filter((n) => n.id !== centralNode.id);
      const angleSlice = (2 * Math.PI) / otherNodes.length;

      otherNodes.forEach((node, index) => {
        const angle = angleSlice * index;
        const radius = 150;
        positions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
      });
    }

    // Limpar canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar arestas
    edges.forEach((edge) => {
      const source = positions[edge.source];
      const target = positions[edge.target];

      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        // Cor baseada no tipo de conexão
        switch (edge.type) {
          case 'financial':
            ctx.strokeStyle = '#ef4444';
            break;
          case 'political':
            ctx.strokeStyle = '#3b82f6';
            break;
          case 'legal':
            ctx.strokeStyle = '#8b5cf6';
            break;
        }

        ctx.lineWidth = edge.weight * 2;
        ctx.stroke();
      }
    });

    // Desenhar nós
    nodes.forEach((node) => {
      const pos = positions[node.id];
      if (!pos) return;

      // Desenhar círculo do nó
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, node.size, 0, 2 * Math.PI);
      ctx.fillStyle = hoveredNode === node.id ? '#fbbf24' : node.color;
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Desenhar rótulo
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label;
      ctx.fillText(label, pos.x, pos.y);
    });
  }, [nodes, edges, hoveredNode, politicianName]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <Network className="text-blue-600" size={24} />
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Grafo de Influências
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Conexões identificadas entre {politicianName} e outras entidades
            </p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onMouseMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Detectar hover sobre nós
            let foundNode = null;
            nodes.forEach((node) => {
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const nodeX = centerX + 150 * Math.cos((nodes.indexOf(node) * 2 * Math.PI) / nodes.length);
              const nodeY = centerY + 150 * Math.sin((nodes.indexOf(node) * 2 * Math.PI) / nodes.length);

              const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
              if (distance < node.size + 5) {
                foundNode = node.id;
              }
            });

            setHoveredNode(foundNode);
          }}
          onMouseLeave={() => setHoveredNode(null)}
        />
      </div>

      {/* Legenda */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-600 dark:text-slate-400">Financeiro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">Político</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-600 dark:text-slate-400">Legal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfluenceGraph;
