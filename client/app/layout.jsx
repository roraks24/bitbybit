import './globals.css';

export const metadata = {
  title: 'TrustLayer — Autonomous AI Payment & Project Agent',
  description: 'Programmable trust for freelance work. AI-powered milestone management, escrow payments, and quality verification.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#020408] text-slate-200 antialiased">{children}</body>
    </html>
  );
}
