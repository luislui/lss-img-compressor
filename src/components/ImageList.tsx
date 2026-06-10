import { useState, useMemo } from 'react'
import { Search, Download, Trash, CheckCircle2, AlertCircle, Loader, Percent } from 'lucide-react'
import { formatBytes } from '../utils/imageCompressor'
import type { CompressedImageResult } from '../utils/imageCompressor'

export interface ImageItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'success' | 'error'
  result?: CompressedImageResult
  error?: string
}

interface ImageListProps {
  items: ImageItem[]
  onRemoveItem: (id: string) => void
  onDownloadItem: (item: ImageItem) => void
}

export function ImageList({ items, onRemoveItem, onDownloadItem }: ImageListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrar elementos de la lista según el buscador
  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [items, searchQuery])

  // Calcular estadísticas globales de compresión (solo de los exitosos)
  const stats = useMemo(() => {
    let originalTotal = 0
    let compressedTotal = 0
    let successCount = 0

    items.forEach((item) => {
      if (item.status === 'success' && item.result) {
        originalTotal += item.result.originalSize
        compressedTotal += item.result.compressedSize
        successCount++
      }
    })

    const difference = originalTotal - compressedTotal
    const ratio = originalTotal > 0 ? (difference / originalTotal) * 100 : 0

    return {
      originalTotal,
      compressedTotal,
      difference,
      ratio,
      successCount,
    }
  }, [items])

  return (
    <div className="space-y-4">
      {/* Resumen de Ahorro Colectivo (Si hay imágenes procesadas con éxito) */}
      {stats.successCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gradient-to-r from-[#63048C]/5 to-[#b855e8]/5 dark:from-[#63048C]/10 dark:to-[#b855e8]/10 border border-[#63048C]/20 dark:border-[#b855e8]/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#63048C]/10 dark:bg-[#b855e8]/20 text-[#63048C] dark:text-[#b855e8]">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Reducción Promedio</p>
              <p className="text-xl font-bold text-[#63048C] dark:text-[#b855e8] tabular-nums">
                {stats.ratio.toFixed(1)}%
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Tamaño Original</p>
            <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
              {formatBytes(stats.originalTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Tamaño Comprimido (JPG)</p>
            <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 tabular-nums">
              {formatBytes(stats.compressedTotal)}
              <span className="text-xs text-green-600 dark:text-green-400 ml-1.5 font-normal">
                (Ahorro de {formatBytes(stats.difference)})
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Buscador e info del listado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          Imágenes Cargadas ({items.length})
        </h2>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar imagen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#63048C] dark:focus:ring-offset-neutral-900"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
        </div>
      </div>

      {/* Tabla de imágenes */}
      <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 shadow-sm">
        <table className="w-full border-collapse text-left text-sm text-neutral-500 dark:text-neutral-400">
          <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold uppercase text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              <th scope="col" className="px-6 py-3 w-16">Miniatura</th>
              <th scope="col" className="px-6 py-3">Nombre</th>
              <th scope="col" className="px-6 py-3">Tamaño (Reducción)</th>
              <th scope="col" className="px-6 py-3">Resolución</th>
              <th scope="col" className="px-6 py-3 w-28 text-center">Estado</th>
              <th scope="col" className="px-6 py-3 w-28 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-neutral-400 dark:text-neutral-500">
                  {searchQuery ? 'No se encontraron imágenes que coincidan.' : 'No hay imágenes en la lista. Arrastra archivos arriba.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const originalSizeFormatted = formatBytes(item.file.size)
                const isSuccess = item.status === 'success' && item.result
                const isProcessing = item.status === 'processing'
                const isError = item.status === 'error'

                let sizeDisplay = originalSizeFormatted
                let resolutionDisplay = '---'
                let savingDisplay = ''

                if (isSuccess && item.result) {
                  const savedBytes = item.result.originalSize - item.result.compressedSize
                  const savedPercent = Math.max(0, Math.round((savedBytes / item.result.originalSize) * 100))
                  sizeDisplay = `${formatBytes(item.result.compressedSize)}`
                  savingDisplay = `-${savedPercent}%`
                  
                  resolutionDisplay = `${item.result.originalWidth}x${item.result.originalHeight} → ${item.result.compressedWidth}x${item.result.compressedHeight}`
                }

                // Generar URL local temporal para la miniatura
                const thumbUrl = isSuccess && item.result 
                  ? item.result.previewUrl 
                  : URL.createObjectURL(item.file)

                return (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    {/* Miniatura */}
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                        <img
                          src={thumbUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onLoad={(e) => {
                            // Si es temporal del archivo original, revocar para evitar fugas si no tiene resultado aún
                            if (!isSuccess) {
                              URL.revokeObjectURL((e.target as HTMLImageElement).src)
                            }
                          }}
                        />
                      </div>
                    </td>

                    {/* Nombre del Archivo */}
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100 break-all max-w-[200px] sm:max-w-xs">
                      {item.file.name}
                      {isSuccess && (
                        <span className="block text-xs text-neutral-400 dark:text-neutral-500 font-normal">
                          Convertido a: {item.result?.name}
                        </span>
                      )}
                    </td>

                    {/* Tamaño y ahorro */}
                    <td className="px-6 py-4 font-normal text-neutral-800 dark:text-neutral-200">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{sizeDisplay}</span>
                        {isSuccess && (
                          <>
                            <span className="text-xs text-neutral-400 line-through">
                              {originalSizeFormatted}
                            </span>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800/40">
                              {savingDisplay}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Resolución */}
                    <td className="px-6 py-4 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                      {resolutionDisplay}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        {isProcessing && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                            <Loader className="w-4 h-4 animate-spin" />
                            Comprimiendo
                          </span>
                        )}
                        {isSuccess && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400" title="Compresión Exitosa">
                            <CheckCircle2 className="w-4.5 h-4.5" />
                            Listo
                          </span>
                        )}
                        {isError && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400" title={item.error}>
                            <AlertCircle className="w-4.5 h-4.5" />
                            Error
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 dark:text-neutral-500">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onDownloadItem(item)}
                          disabled={!isSuccess}
                          className="p-1.5 rounded text-[#63048C] hover:bg-[#63048C]/10 dark:text-[#b855e8] dark:hover:bg-[#b855e8]/15 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title="Descargar JPG comprimido"
                          aria-label="Descargar esta imagen"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Quitar de la lista"
                          aria-label="Quitar de la lista"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
