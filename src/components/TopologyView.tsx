import React, { useState } from 'react';
import { Shield, Server, Terminal, Lock, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { ScenarioTopology, OpenPort } from '../types';

interface TopologyViewProps {
  topology: ScenarioTopology;
  openPorts: OpenPort[];
  ip: string;
  codename: string;
}

export const TopologyView: React.FC<TopologyViewProps> = ({ topology, openPorts, ip, codename }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('target');

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'attacker':
        return <Terminal className="w-5 h-5 text-amber-400" />;
      case 'gateway':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'target':
        return <Server className="w-5 h-5 text-rose-400" />;
      case 'internal':
        return <Lock className="w-5 h-5 text-emerald-400" />;
      default:
        return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  const selectedNode = topology.nodes.find((n) => n.id === selectedNodeId) || topology.nodes[0];

  return (
    <div className="space-y-6">
      {/* Topology Header */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Topología de Red del Laboratorio</h3>
            <p className="text-xs text-slate-400 mt-1">
              Arquitectura aislada del reto con segmentación DMZ y visualización de la cadena de ataque.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Subred: 10.10.110.0/24</span>
            <span aria-hidden="true">·</span>
            <span>Objetivo: {ip}</span>
          </div>
        </div>

        {/* Visual Graph Pipeline */}
        <div className="py-8 px-2 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[720px] gap-3">
            {topology.nodes.map((node, index) => {
              const isSelected = node.id === selectedNodeId;
              const link = topology.links[index];

              return (
                <React.Fragment key={node.id}>
                  {/* Node Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`flex-1 text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30 shadow-lg shadow-cyan-950/50'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        {getNodeIcon(node.type)}
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                        {node.type}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-100 truncate">{node.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{node.role}</div>
                  </button>

                  {/* Flow Arrow */}
                  {index < topology.nodes.length - 1 && (
                    <div className="flex flex-col items-center px-1 text-slate-500 shrink-0">
                      <ArrowRight className="w-5 h-5 text-cyan-400/80 animate-pulse" />
                      {link && (
                        <span className="text-[10px] font-mono text-slate-400 mt-1 max-w-[80px] text-center truncate">
                          {link.proto}
                        </span>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Node Details & Port Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Spec Panel */}
        <div className="lg:col-span-1 border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Info className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-slate-200">Inspección de Nodo: {selectedNode.label}</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">Identificador de Topología</span>
              <span className="font-mono text-slate-200">{selectedNode.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Rol en el Reto</span>
              <span className="text-slate-200">{selectedNode.role}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Tipo de Dispositivo</span>
              <span className="font-mono uppercase text-cyan-400">{selectedNode.type}</span>
            </div>
            {selectedNode.type === 'target' && (
              <div>
                <span className="text-slate-500 block">Codename del Host</span>
                <span className="font-mono text-rose-400">{codename}</span>
              </div>
            )}
          </div>
        </div>

        {/* Exposed Network Ports Table */}
        <div className="lg:col-span-2 border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-semibold text-slate-200">Superficie de Red & Puertos Expuestos</h4>
            <span className="text-xs text-slate-400 font-mono">Total: {openPorts.length} puertos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-2 font-medium">Puerto / Proto</th>
                  <th className="pb-2 font-medium">Servicio</th>
                  <th className="pb-2 font-medium">Versión</th>
                  <th className="pb-2 font-medium">Propósito en el Escenario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {openPorts.map((p) => (
                  <tr key={p.port} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 text-cyan-400 font-semibold">{p.port}/tcp</td>
                    <td className="py-2.5 text-slate-200">{p.service}</td>
                    <td className="py-2.5 text-slate-400">{p.version}</td>
                    <td className="py-2.5 text-slate-300 font-sans">{p.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
