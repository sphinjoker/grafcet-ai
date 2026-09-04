import React from 'react';
import { GrafcetData } from '@/lib/types';
import { extractVariables } from '@/lib/variables';

export function VariablesTab({ data }: { data: GrafcetData }) {
  const variables = Array.isArray(data.variables) && data.variables.length > 0 ? data.variables : extractVariables(data);

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-bold mb-4">Table des Variables Détectées</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-2">Nom</th>
              <th className="p-2">Type</th>
              <th className="p-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v, i) => (
              <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-2 font-mono font-bold text-blue-700">{v.name}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    v.type === 'input' ? 'bg-green-100 text-green-800' :
                    v.type === 'output' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {v.type === 'input' ? 'Entrée' : v.type === 'output' ? 'Sortie' : 'Temporisation'}
                  </span>
                </td>
                <td className="p-2 text-gray-600">{v.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}