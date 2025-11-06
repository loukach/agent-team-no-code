import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AGENT_POSITIONS = {
  orchestrator: { x: 400, y: 80, width: 160, height: 60 },
  progressive: { x: 150, y: 250, width: 140, height: 140 },
  conservative: { x: 400, y: 250, width: 140, height: 140 },
  tech: { x: 650, y: 250, width: 140, height: 140 }
};

const AGENT_COLORS = {
  orchestrator: '#8B5CF6',
  progressive: '#3B82F6',
  conservative: '#EF4444',
  tech: '#A855F7'
};

export default function AgentOrchestrationCanvas({ messages, phase }) {
  const canvasRef = useRef(null);
  const [agents, setAgents] = useState({
    orchestrator: { status: 'idle', action: '' },
    progressive: { status: 'idle', action: '', tool: null },
    conservative: { status: 'idle', action: '', tool: null },
    tech: { status: 'idle', action: '', tool: null }
  });
  const [connections, setConnections] = useState([]);

  // Update agent states based on messages
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // Update agent status based on message
    if (lastMessage.agent) {
      setAgents(prev => ({
        ...prev,
        [lastMessage.agent]: {
          status: getStatusFromAction(lastMessage.action),
          action: lastMessage.message,
          tool: lastMessage.tool
        }
      }));

      // Add connections for certain actions
      if (lastMessage.action === 'reading') {
        setConnections(prev => [...prev, {
          from: lastMessage.agent,
          to: 'others',
          type: 'reading'
        }]);
      } else if (lastMessage.action === 'tool_use') {
        setConnections(prev => [...prev, {
          from: lastMessage.agent,
          to: 'internet',
          type: 'searching'
        }]);
      }
    }

    // Clear old connections after animation
    setTimeout(() => {
      setConnections(prev => prev.slice(-3)); // Keep only last 3 connections
    }, 3000);
  }, [messages]);

  const getStatusFromAction = (action) => {
    if (!action) return 'idle';
    if (action === 'tool_use') return 'searching';
    if (action === 'writing') return 'writing';
    if (action === 'reading') return 'reading';
    if (action === 'debating') return 'debating';
    if (action === 'finalizing') return 'finalizing';
    return 'active';
  };

  const getStatusColor = (status) => {
    const colors = {
      idle: '#9CA3AF',
      searching: '#F59E0B',
      writing: '#10B981',
      reading: '#6366F1',
      debating: '#EC4899',
      finalizing: '#22C55E',
      active: '#3B82F6'
    };
    return colors[status] || colors.idle;
  };

  const drawHandDrawnRect = (ctx, x, y, width, height, roughness = 2) => {
    ctx.beginPath();
    // Add some randomness for hand-drawn effect
    const offset = () => (Math.random() - 0.5) * roughness;

    ctx.moveTo(x + offset(), y + offset());
    ctx.lineTo(x + width + offset(), y + offset());
    ctx.lineTo(x + width + offset(), y + height + offset());
    ctx.lineTo(x + offset(), y + height + offset());
    ctx.closePath();

    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawConnection = (ctx, from, to, animated = false) => {
    const fromPos = AGENT_POSITIONS[from];
    const toPos = to === 'internet'
      ? { x: fromPos.x + fromPos.width / 2, y: 450 }
      : to === 'others'
      ? { x: 400, y: 320 }
      : AGENT_POSITIONS[to];

    if (!fromPos || !toPos) return;

    const startX = fromPos.x + fromPos.width / 2;
    const startY = fromPos.y + fromPos.height;
    const endX = toPos.x + (toPos.width ? toPos.width / 2 : 0);
    const endY = toPos.y;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Bezier curve for smoother connection
    const controlY = (startY + endY) / 2;
    ctx.bezierCurveTo(
      startX, controlY,
      endX, controlY,
      endX, endY
    );

    if (animated) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
    } else {
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections first (behind agents)
    // Static connections
    drawConnection(ctx, 'orchestrator', 'progressive');
    drawConnection(ctx, 'orchestrator', 'conservative');
    drawConnection(ctx, 'orchestrator', 'tech');

    // Animated connections
    connections.forEach(conn => {
      if (conn.to === 'internet') {
        // Draw to cloud icon position
        const fromPos = AGENT_POSITIONS[conn.from];
        drawConnection(ctx, conn.from, 'internet', true);
      } else if (conn.to === 'others') {
        // Draw connections between agents
        drawConnection(ctx, conn.from, 'others', true);
      }
    });

    // Draw orchestrator
    const orch = AGENT_POSITIONS.orchestrator;
    ctx.fillStyle = '#F3F4F6';
    drawHandDrawnRect(ctx, orch.x, orch.y, orch.width, orch.height);
    ctx.fillRect(orch.x, orch.y, orch.width, orch.height);

    ctx.fillStyle = AGENT_COLORS.orchestrator;
    ctx.font = 'bold 14px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText('Editor-in-Chief', orch.x + orch.width/2, orch.y + 25);

    ctx.fillStyle = getStatusColor(agents.orchestrator.status);
    ctx.font = '12px Comic Sans MS';
    ctx.fillText(phase ? phase.title : 'Orchestrating', orch.x + orch.width/2, orch.y + 45);

    // Draw newspaper agents
    ['progressive', 'conservative', 'tech'].forEach(agentType => {
      const pos = AGENT_POSITIONS[agentType];
      const agent = agents[agentType];

      // Agent box
      ctx.fillStyle = '#FFFFFF';
      drawHandDrawnRect(ctx, pos.x, pos.y, pos.width, pos.height);
      ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

      // Agent name
      ctx.fillStyle = AGENT_COLORS[agentType];
      ctx.font = 'bold 14px Comic Sans MS';
      ctx.textAlign = 'center';
      const names = {
        progressive: 'Progressive',
        conservative: 'Conservative',
        tech: 'Tech Daily'
      };
      ctx.fillText(names[agentType], pos.x + pos.width/2, pos.y + 25);

      // Status
      ctx.fillStyle = getStatusColor(agent.status);
      ctx.fillRect(pos.x + 10, pos.y + 35, pos.width - 20, 3);

      // Current action
      if (agent.action) {
        ctx.fillStyle = '#4B5563';
        ctx.font = '11px Comic Sans MS';
        const lines = wrapText(ctx, agent.action, pos.width - 20);
        lines.forEach((line, i) => {
          ctx.fillText(line, pos.x + pos.width/2, pos.y + 55 + (i * 15));
        });
      }

      // Tool indicator
      if (agent.tool) {
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(pos.x + pos.width - 30, pos.y + pos.height - 30, 20, 20);
        ctx.fillStyle = '#000';
        ctx.font = '16px sans-serif';
        ctx.fillText('🔍', pos.x + pos.width - 20, pos.y + pos.height - 15);
      }
    });

    // Draw internet clouds for active searches
    connections
      .filter(conn => conn.to === 'internet')
      .forEach(conn => {
        const pos = AGENT_POSITIONS[conn.from];
        const cloudX = pos.x + pos.width / 2;
        const cloudY = 450;

        // Draw cloud shape
        ctx.fillStyle = '#E0E7FF';
        ctx.beginPath();
        ctx.arc(cloudX - 15, cloudY, 20, 0, Math.PI * 2);
        ctx.arc(cloudX + 15, cloudY, 20, 0, Math.PI * 2);
        ctx.arc(cloudX, cloudY - 10, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4F46E5';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌐', cloudX, cloudY + 5);
      });
  }, [agents, connections, phase]);

  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 3); // Max 3 lines
  };

  return (
    <div className="relative bg-gray-50 rounded-lg p-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="border-2 border-gray-300 rounded-lg bg-white"
        style={{
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))',
          background: 'linear-gradient(to bottom right, #FAFAFA, #F3F4F6)'
        }}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-lg border">
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500"></div> Searching
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500"></div> Writing
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-indigo-500"></div> Reading
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-pink-500"></div> Debating
          </span>
        </div>
      </div>
    </div>
  );
}