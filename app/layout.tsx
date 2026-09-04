import type { Metadata } from 'next';
import '@xyflow/react/dist/style.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'GRAFCET AI - Générateur automatique de GRAFCET',
  description: 'Générez et modifiez vos GRAFCET automatiquement à partir de langage naturel.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}