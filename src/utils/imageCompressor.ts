export interface CompressedImageResult {
  id: string
  name: string
  originalSize: number
  compressedSize: number
  originalWidth: number
  originalHeight: number
  compressedWidth: number
  compressedHeight: number
  qualityUsed: number
  blob: Blob
  previewUrl: string
}

/**
 * Comprime y convierte una imagen a JPG utilizando HTML5 Canvas.
 * 
 * @param file Archivo original de imagen (PNG, JPG, WEBP, etc.)
 * @param quality Calidad de compresión (0.1 a 1.0)
 * @param maxWidthOrHeight Opcional: Redimensionar imagen si supera este límite
 */
export function compressImage(
  file: File,
  quality: number, // entre 0.1 y 1.0
  maxWidthOrHeight?: number,
  scalePercent?: number // entre 10 y 100
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo no es una imagen válida.'))
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let width = img.naturalWidth || img.width
      let height = img.naturalHeight || img.height
      const originalWidth = width
      const originalHeight = height

      // Aplicar reducción por porcentaje de dimensiones si se indica
      if (scalePercent && scalePercent > 0 && scalePercent < 100) {
        const factor = scalePercent / 100
        width = Math.round(width * factor)
        height = Math.round(height * factor)
      }

      // Opcional: Redimensionado manteniendo la relación de aspecto
      if (maxWidthOrHeight && (width > maxWidthOrHeight || height > maxWidthOrHeight)) {
        if (width > height) {
          height = Math.round((height * maxWidthOrHeight) / width)
          width = maxWidthOrHeight
        } else {
          width = Math.round((width * maxWidthOrHeight) / height)
          height = maxWidthOrHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D del Canvas.'))
        return
      }

      // Dibujar fondo blanco en caso de PNG con transparencias
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)

      // Dibujar la imagen sobre el canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Exportar como JPG (image/jpeg) con calidad personalizada
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al generar el Blob comprimido.'))
            return
          }

          const previewUrl = URL.createObjectURL(blob)
          
          // Reemplazar la extensión del archivo a .jpg
          const lastDotIndex = file.name.lastIndexOf('.')
          const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name
          const newName = `${baseName}.jpg`

          resolve({
            id: Math.random().toString(36).substring(2, 9),
            name: newName,
            originalSize: file.size,
            compressedSize: blob.size,
            originalWidth,
            originalHeight,
            compressedWidth: width,
            compressedHeight: height,
            qualityUsed: quality,
            blob,
            previewUrl,
          })
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Error al procesar la imagen.'))
    }

    img.src = objectUrl
  })
}

/**
 * Formatea bytes en un formato legible para humanos (KB, MB, etc.)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const isNegative = bytes < 0
  const absBytes = Math.abs(bytes)
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(absBytes) / Math.log(k))
  const formattedValue = parseFloat((absBytes / Math.pow(k, i)).toFixed(dm))
  return (isNegative ? '-' : '') + formattedValue + ' ' + sizes[i]
}
