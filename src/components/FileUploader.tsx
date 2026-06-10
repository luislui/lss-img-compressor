import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function FileUploader({ onFilesSelected, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function processFiles(files: FileList | File[]) {
    const validImages = Array.from(files).filter((file) => {
      const type = file.type.toLowerCase()
      const extension = file.name.toLowerCase()
      return (
        type.startsWith('image/') ||
        extension.endsWith('.jpg') ||
        extension.endsWith('.jpeg') ||
        extension.endsWith('.png') ||
        extension.endsWith('.webp') ||
        extension.endsWith('.gif') ||
        extension.endsWith('.bmp')
      )
    })

    if (validImages.length > 0) {
      onFilesSelected(validImages)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files?.length) processFiles(files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const files = e.dataTransfer.files
    if (files?.length) processFiles(files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(!disabled)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200
          flex flex-col items-center justify-center gap-3
          ${
            isDragging
              ? 'border-[#63048C] dark:border-[#b855e8] bg-[#63048C]/10 dark:bg-[#b855e8]/15 shadow-inner'
              : 'border-[#63048C]/70 dark:border-[#b855e8]/70 hover:border-[#63048C] dark:hover:border-[#b855e8] hover:bg-[#63048C]/5 dark:hover:bg-[#b855e8]/10'
          }
          ${disabled ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/bmp"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <UploadCloud className="w-10 h-10 text-[#63048C] dark:text-[#b855e8] animate-pulse" />
        
        <div>
          <p className="text-neutral-700 dark:text-neutral-300 font-medium">
            Arrastra tus imágenes aquí o haz clic para seleccionarlas
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1.5">
            Soporta formatos JPG, JPEG, PNG, WEBP, GIF y BMP (Procesamiento por lote)
          </p>
        </div>
      </div>
    </div>
  )
}
