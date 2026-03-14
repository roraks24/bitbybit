import './globals.css';

export const metadata = {
  title: 'TrustLayer — Autonomous AI Payment & Project Agent',
  description: 'Programmable trust for freelance work. AI-powered milestone management, escrow payments, and quality verification.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
