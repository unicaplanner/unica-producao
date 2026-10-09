// Layout das paginas de impressao: sem o cabecalho/menu do app (fica fora do
// grupo (app)). O @page define o papel A5 em pe; o que tiver a classe
// "no-print" some na hora de imprimir.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-white text-black print:bg-white">
      <style>{`
        @page { size: A5 portrait; margin: 8mm; }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      {children}
    </div>
  );
}
