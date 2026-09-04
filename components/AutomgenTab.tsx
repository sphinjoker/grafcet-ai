import React, { useState } from 'react';
import { GrafcetData } from '@/lib/types';
import { generateAutomgenCode } from '@/lib/automgen';

export function AutomgenTab({ data }: { data: GrafcetData }) {
  const { code, note } = generateAutomgenCode(data);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${data.title.toLowerCase().replace(/\s+/g, '_')}_automgen.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-4 text-xs text-amber-800">
        {note}
      </div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-bold">Code / Syntaxe AUTOMGEN</h3>
        <div className="space-x-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
          >
            {copied ? 'Copié !' : 'Copier'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            Télécharger pour AUTOMGEN
          </button>
        </div>
      </div>
      <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto font-mono text-xs">
        {code}
      </pre>
    </div>
  );
}