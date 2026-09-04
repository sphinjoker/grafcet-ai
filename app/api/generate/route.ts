import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/prompt';
import { validateGrafcet } from '@/lib/validate';
import { GrafcetData } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentGrafcet } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Le prompt est requis.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Groq manquante. Ajoute GROQ_API_KEY dans tes variables d'environnement (.env.local ou config Netlify)." },
        { status: 500 }
      );
    }

    // Construit le message utilisateur, en donnant le GRAFCET existant si on est en mode modification
    const userMessage = currentGrafcet
      ? `GRAFCET actuel (à modifier) :\n${JSON.stringify(currentGrafcet)}\n\nDemande de modification :\n${prompt}`
      : `Description du système à automatiser :\n${prompt}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Erreur API Groq:', errText);
      return NextResponse.json(
        { error: `Erreur de l'API Groq (${groqRes.status}). Vérifie ta clé API GROQ_API_KEY.` },
        { status: 502 }
      );
    }

    const groqData = await groqRes.json();
    const rawText = groqData.choices?.[0]?.message?.content?.trim();

    if (!rawText) {
      return NextResponse.json({ error: "Réponse vide de l'IA." }, { status: 500 });
    }

    // Nettoyage au cas où le modèle ajoute quand même un bloc markdown ```json ... ```
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let grafcetData: GrafcetData;
    try {
      grafcetData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON invalide reçu de Groq:', rawText);
      return NextResponse.json(
        { error: "L'IA n'a pas renvoyé un JSON valide. Réessaie avec une description plus précise." },
        { status: 500 }
      );
    }

    const validation = validateGrafcet(grafcetData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `GRAFCET généré invalide : ${validation.errors.join(' ')}` },
        { status: 500 }
      );
    }

    return NextResponse.json(grafcetData);
  } catch (error: any) {
    console.error('Erreur route /api/generate:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de la génération.' }, { status: 500 });
  }
}