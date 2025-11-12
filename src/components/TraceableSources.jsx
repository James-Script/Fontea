import { ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

export default function TraceableSources({ fontes = [] }) {
  if (!fontes || fontes.length === 0) {
    return null
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ExternalLink className="h-5 w-5 text-fontea-primary" />
        <h2 className="text-xl font-bold text-gray-900">Fontes Rastreáveis</h2>
      </div>

      <div className="space-y-3">
        {fontes.map((fonte, index) => {
          const dataAcesso = fonte.data_acesso 
            ? (fonte.data_acesso instanceof Date 
                ? format(fonte.data_acesso, "dd/MM/yyyy", { locale: ptBR })
                : fonte.data_acesso)
            : format(new Date(), "dd/MM/yyyy", { locale: ptBR })

          return (
            <div
              key={index}
              className="bg-white border border-blue-200 rounded-lg p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              {/* Número da fonte */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
              </div>

              {/* Informações da fonte */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <a
                      href={fonte.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold text-base block mb-1 hover:underline"
                    >
                      {fonte.nome || `Fonte ${index + 1}`}
                    </a>
                    <p className="text-sm text-gray-500">
                      Acessado em {dataAcesso}
                    </p>
                  </div>
                  {fonte.url && (
                    <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

