'use client';

import React, { useState, useEffect } from 'react';
import { GrafcetData } from '@/lib/types';
import { GrafcetCanvas } from '@/components/GrafcetCanvas';
import { VariablesTab } from '@/components/VariablesTab';
import { AutomgenTab } from '@/components/AutomgenTab';
import { JsonTab } from '@/components/JsonTab';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [grafcet, setGrafcet] = useState<GrafcetData | null>(null);
  const [activeTab, setActiveTab] = useState<'grafcet' | 'variables' | 'automgen' | 'json'>('grafcet');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('grafcet_current');
    if (saved) {
      try {
        setGrafcet(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveToStorage = (data: GrafcetData) => {
    localStorage.setItem('grafcet_current', JSON.stringify(data));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, currentGrafcet: grafcet }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la génération.');
      }

      setGrafcet(data);
      saveToStorage(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    if (confirm('Voulez-vous vraiment réinitialiser le GRAFCET actuel ?')) {
      setGrafcet(null);
      setPrompt('');
      localStorage.removeItem('grafcet_current');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">GRAFCET AI</h1>
            <p className="text-sm text-gray-500">Générateur automatique de GRAFCET par intelligence artificielle</p>
          </div>
          {grafcet && (
            <button
              onClick={handleNew}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium"
            >
              Nouveau GRAFCET
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={4}
            placeholder="Décrivez le fonctionnement de votre automatisme... (ex: Quand j'appuie sur Marche, le moteur démarre...)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Génération en cours...' : grafcet ? 'Modifier le GRAFCET' : 'Générer le GRAFCET'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {grafcet?.ambiguities && grafcet.ambiguities.length > 0 && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md border border-yellow-200">
            <p className="font-bold">Précisions requises par l'IA :</p>
            <ul className="list-disc pl-5 text-sm">
              {grafcet.ambiguities.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {grafcet && (
          <div className="space-y-4">
            <div className="flex border-b border-gray-200 space-x-2">
              <button
                onClick={() => setActiveTab('grafcet')}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === 'grafcet' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                GRAFCET
              </button>
              <button
                onClick={() => setActiveTab('variables')}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === 'variables' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                Variables
              </button>
              <button
                onClick={() => setActiveTab('automgen')}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === 'automgen' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                AUTOMGEN
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`py-2 px-4 font-medium text-sm border-b-2 ${
                  activeTab === 'json' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                JSON
              </button>
            </div>

            <div>
              {activeTab === 'grafcet' && <GrafcetCanvas data={grafcet} />}
              {activeTab === 'variables' && <VariablesTab data={grafcet} />}
              {activeTab === 'automgen' && <AutomgenTab data={grafcet} />}
              {activeTab === 'json' && <JsonTab data={grafcet} />}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}