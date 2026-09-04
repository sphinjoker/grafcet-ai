import React from 'react';
import { GrafcetData } from '@/lib/types';

export function JsonTab({ data }: { data: GrafcetData }) {
  const jsonString = JSON.stringify(data, null, 2);

  const handleExport = () => {
    const element = document.createElement('a');
    const file = new Blob([jsonString], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `grafcet_${Date.now()}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-bold">Représentation JSON</h3>
        <button
          onClick={handleExport}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
        >
          Exporter JSON
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto font-mono text-xs">
        {jsonString}
      </pre>
    </div>
  );
}