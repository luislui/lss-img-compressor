import { Sliders, RefreshCw, Trash2, Download } from 'lucide-react'

interface CompressionControlsProps {
  quality: number // 0.1 to 1.0
  onQualityChange: (quality: number) => void
  scalePercent: number // 10 to 100
  onScalePercentChange: (scale: number) => void
  maxDimension: number | undefined
  onMaxDimensionChange: (dim: number | undefined) => void
  onRecompressAll: () => void
  onClear: () => void
  onDownloadAll: () => void
  canDownload: boolean
  isProcessing: boolean
  totalCount: number
}

export function CompressionControls({
  quality,
  onQualityChange,
  scalePercent,
  onScalePercentChange,
  maxDimension,
  onMaxDimensionChange,
  onRecompressAll,
  onClear,
  onDownloadAll,
  canDownload,
  isProcessing,
  totalCount,
}: CompressionControlsProps) {
  // Ajuste matemático limpio:
  const displayLevel = Math.round((1.1 - quality) * 100)

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        
        {/* Nivel de Compresión */}
        <div className="flex-1 space-y-2">
          <label className="flex justify-between items-center text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#63048C] dark:text-[#b855e8]" />
              Nivel de compresión:
            </span>
            <span className="text-[#63048C] dark:text-[#b855e8] text-base font-bold tabular-nums">
              {displayLevel}%
            </span>
          </label>
          <div className="flex items-center gap-3 h-[38px]">
            <span className="text-xs text-neutral-400">Mínimo</span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={displayLevel}
              onChange={(e) => {
                const level = parseInt(e.target.value)
                const qualityVal = parseFloat(((110 - level) / 100).toFixed(2))
                onQualityChange(qualityVal)
              }}
              disabled={isProcessing || totalCount === 0}
              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#63048C] dark:accent-[#b855e8] disabled:opacity-50"
            />
            <span className="text-xs text-neutral-400">Máximo</span>
          </div>
        </div>

        {/* Escalar Dimensiones (%) */}
        <div className="flex-1 space-y-2">
          <label className="flex justify-between items-center text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#63048C] dark:text-[#b855e8]" />
              Escalar Dimensiones:
            </span>
            <span className="text-[#63048C] dark:text-[#b855e8] text-base font-bold tabular-nums">
              {scalePercent}%
            </span>
          </label>
          <div className="flex items-center gap-3 h-[38px]">
            <span className="text-xs text-neutral-400">10%</span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={scalePercent}
              onChange={(e) => onScalePercentChange(parseInt(e.target.value))}
              disabled={isProcessing || totalCount === 0}
              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#63048C] dark:accent-[#b855e8] disabled:opacity-50"
            />
            <span className="text-xs text-neutral-400">100% (Orig)</span>
          </div>
        </div>

        {/* Tamaño Máximo / Redimensionamiento */}
        <div className="w-full lg:w-48 space-y-2">
          <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Límite de Ancho/Alto:
          </label>
          <select
            value={maxDimension || 'original'}
            onChange={(e) => {
              const val = e.target.value
              onMaxDimensionChange(val === 'original' ? undefined : parseInt(val))
            }}
            disabled={isProcessing || totalCount === 0}
            className="w-full px-3 py-1.5 text-sm bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#63048C] focus:ring-offset-1 dark:focus:ring-offset-neutral-900 disabled:opacity-50"
          >
            <option value="original">Sin límite fijo</option>
            <option value="1920">Máx 1920px (Full HD)</option>
            <option value="1280">Máx 1280px (HD)</option>
            <option value="800">Máx 800px (Web/Móvil)</option>
          </select>
        </div>

        {/* Botón de Re-comprimir */}
        <div className="w-full lg:w-auto">
          <button
            type="button"
            onClick={onRecompressAll}
            disabled={isProcessing || totalCount === 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-700 px-4 py-2 text-sm text-neutral-800 dark:text-neutral-200 shadow-sm transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#63048C] dark:focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            title="Aplica los parámetros actuales a todas las imágenes cargadas"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            Procesar Cambios
          </button>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700 pt-4 flex-wrap gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-md border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 text-sm text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Todo ({totalCount})
          </button>

          <button
            type="button"
            onClick={onDownloadAll}
            disabled={!canDownload || isProcessing}
            className="inline-flex items-center gap-2 rounded-md border border-transparent bg-[#63048C] dark:bg-[#b855e8] px-4 py-1.5 text-sm text-white hover:bg-[#4d036e] dark:hover:bg-[#a640d6] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#63048C] dark:focus:ring-offset-neutral-900 font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Descargar Todo (.ZIP)
          </button>
        </div>
      )}
    </div>
  )
}
