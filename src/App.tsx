import { useState, useEffect, useMemo } from "react";
import { Toaster, toast } from "react-hot-toast";
import JSZip from "jszip";
import { Sun, Moon, HelpCircle, ArrowLeft, Info } from "lucide-react";
import {
  LSS_THEME_STORAGE_KEY,
  LSS_THEME_DARK,
  LSS_THEME_LIGHT,
} from "./utils/themeStorage";
import { compressImage } from "./utils/imageCompressor";
import { FileUploader } from "./components/FileUploader";
import { CompressionControls } from "./components/CompressionControls";
import { ImageList } from "./components/ImageList";
import type { ImageItem } from "./components/ImageList";
import logoShort from "./assets/images/logo_loeram_short.png";
import "./App.css";
import { APP_VERSION } from "./version";

function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(0.8); // Default 80%
  const [scalePercent, setScalePercent] = useState(100); // Default 100%
  const [maxDimension, setMaxDimension] = useState<number | undefined>(
    undefined,
  ); // Optional limit
  const [isProcessing, setIsProcessing] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Sincronización del tema claro/oscuro
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(LSS_THEME_STORAGE_KEY);
    if (stored) return stored === LSS_THEME_DARK;
    return true; // Default dark mode
  });

  // Instalar worker para ver offline
  function install() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) =>
          console.error("Service Worker registration failed:", err),
        );
    }
  }

  useEffect(() => {
    install()
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem(LSS_THEME_STORAGE_KEY, LSS_THEME_DARK);
    } else {
      root.classList.remove("dark");
      localStorage.setItem(LSS_THEME_STORAGE_KEY, LSS_THEME_LIGHT);
    }
  }, [dark]);

  // Compresión individual de un elemento específico
  const compressSingleItem = async (
    item: ImageItem,
    qualityVal: number,
    dimensionVal: number | undefined,
    scalePercentVal?: number,
  ): Promise<ImageItem> => {
    try {
      // Si ya existía un resultado previo, limpiar su URL temporal para evitar fugas de memoria
      if (item.result?.previewUrl) {
        URL.revokeObjectURL(item.result.previewUrl);
      }

      const compressedResult = await compressImage(
        item.file,
        qualityVal,
        dimensionVal,
        scalePercentVal,
      );
      return {
        ...item,
        status: "success",
        result: compressedResult,
        error: undefined,
      };
    } catch (err) {
      return {
        ...item,
        status: "error",
        error: err instanceof Error ? err.message : "Error al comprimir",
      };
    }
  };

  // Cargar imágenes nuevas e iniciar su procesamiento inmediato
  const handleFilesSelected = async (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      status: "pending",
    }));

    // Agregar todos en estado pending primero
    setItems((prev) => [...prev, ...newItems]);
    toast.success(`${newItems.length} imágenes añadidas al lote`);

    // Procesar las imágenes agregadas secuencialmente o en paralelo controlado
    // Usamos actualizaciones funcionales de estado para marcar procesando y success/error
    for (const item of newItems) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "processing" } : i,
        ),
      );

      const updated = await compressSingleItem(
        item,
        quality,
        maxDimension,
        scalePercent,
      );

      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    }
  };

  // Re-procesar todas las imágenes actualmente cargadas con los parámetros actuales
  const handleRecompressAll = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    const toastId = toast.loading("Procesando compresión en lote...");

    try {
      // Cambiar todos a processing
      setItems((prev) => prev.map((i) => ({ ...i, status: "processing" })));

      const promises = items.map(async (item) => {
        const updated = await compressSingleItem(
          item,
          quality,
          maxDimension,
          scalePercent,
        );
        setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
        return updated;
      });

      await Promise.all(promises);
      toast.success("¡Compresión masiva completada!", { id: toastId });
    } catch {
      toast.error("Ocurrió un error al procesar las imágenes.", {
        id: toastId,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quitar una sola imagen
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.result?.previewUrl) {
        URL.revokeObjectURL(target.result.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  // Limpiar lista completa
  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.result?.previewUrl) {
        URL.revokeObjectURL(item.result.previewUrl);
      }
    });
    setItems([]);
    toast.success("Lista de imágenes limpia");
  };

  // Descargar un elemento individual
  const handleDownloadItem = (item: ImageItem) => {
    if (item.status !== "success" || !item.result) return;
    const link = document.createElement("a");
    link.href = item.result.previewUrl;
    link.download = item.result.name;
    link.click();
  };

  // Descargar todas las imágenes exitosas empaquetadas en un archivo ZIP
  const handleDownloadAll = async () => {
    const successItems = items.filter(
      (i) => i.status === "success" && i.result,
    );
    if (successItems.length === 0) {
      toast.error("No hay imágenes comprimidas listas para descargar");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Preparando paquete ZIP de imágenes...");
    const zip = new JSZip();

    // Controlar duplicados de nombres de archivos en el zip
    const nameCount: { [key: string]: number } = {};

    successItems.forEach((item) => {
      if (item.result) {
        let fileName = item.result.name;
        // Evitar colisiones de nombres si el usuario subió imágenes del mismo nombre desde carpetas distintas
        if (nameCount[fileName] !== undefined) {
          nameCount[fileName]++;
          const lastDot = fileName.lastIndexOf(".");
          const base = fileName.substring(0, lastDot);
          const ext = fileName.substring(lastDot);
          fileName = `${base}_(${nameCount[fileName]})${ext}`;
        } else {
          nameCount[fileName] = 0;
        }
        zip.file(fileName, item.result.blob);
      }
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = "lss_imagenes_comprimidas.zip";
      link.click();
      URL.revokeObjectURL(zipUrl);
      toast.success("¡Descarga masiva ZIP iniciada!", { id: toastId });
    } catch (err) {
      toast.error("Error al empaquetar imágenes.", { id: toastId });
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Saber si hay elementos completados para descargar
  const hasDownloadableItems = useMemo(() => {
    return items.some((i) => i.status === "success");
  }, [items]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Header idéntico al del Lector de CFDIs */}
      <header className="border-b border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex shrink-0 items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-5 w-5" />
              <img
                src={logoShort}
                alt="Loeram"
                className="h-10 w-auto object-contain"
              />
            </a>
            <div>
              <h1 className="m-0 text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                LSS compresor de imágenes
              </h1>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-550">
                v{APP_VERSION}
              </p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-450">
                Optimiza tus imágenes reduciendo su peso y convirtiéndolas a
                JPG.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-neutral-400 bg-neutral-100 px-3 py-1.5 text-sm text-neutral-800 shadow-sm transition-colors hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#63048C] focus:ring-offset-1 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600 dark:focus:ring-offset-neutral-900"
              title="Ayuda"
              aria-label="Abrir ayuda"
            >
              <HelpCircle className="h-[18px] w-[18px] shrink-0" aria-hidden />
              Ayuda
            </button>

            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="rounded-lg p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              title={dark ? "Modo claro" : "Modo oscuro"}
              aria-label={
                dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
              }
            >
              {dark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Cuerpo principal */}
      <main className="flex-1 w-full flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
          {/* Zona de Arrastre/Carga */}
          <FileUploader
            onFilesSelected={handleFilesSelected}
            disabled={isProcessing}
          />

          {/* Panel de Configuración global de Compresión */}
          <CompressionControls
            quality={quality}
            onQualityChange={setQuality}
            scalePercent={scalePercent}
            onScalePercentChange={setScalePercent}
            maxDimension={maxDimension}
            onMaxDimensionChange={setMaxDimension}
            onRecompressAll={handleRecompressAll}
            onClear={handleClearAll}
            onDownloadAll={handleDownloadAll}
            canDownload={hasDownloadableItems}
            isProcessing={isProcessing}
            totalCount={items.length}
          />

          {/* Listado interactivo de imágenes cargadas */}
          {items.length > 0 && (
            <ImageList
              items={items}
              onRemoveItem={handleRemoveItem}
              onDownloadItem={handleDownloadItem}
            />
          )}
        </div>
      </main>

      {/* Modal Informativo / Ayuda */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-300 bg-white shadow-xl dark:border-neutral-600 dark:bg-neutral-800">
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-600 dark:bg-neutral-800">
              <h2
                id="help-title"
                className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
              >
                Ayuda - Compresor de Imágenes LSS
              </h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="rounded p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-600 dark:hover:text-neutral-200"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 px-5 py-4 text-sm text-neutral-700 dark:text-neutral-300">
              <section>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
                  Carga Masiva
                </h3>
                <p className="mb-0">
                  Arrastra o selecciona múltiples imágenes (formatos JPG, PNG,
                  WEBP, GIF, BMP) a la zona superior. El procesamiento iniciará
                  automáticamente usando la calidad de compresión configurada
                  actualmente.
                </p>
              </section>

              <section>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
                  Conversión a JPG
                </h3>
                <p className="mb-0">
                  Toda imagen cargada se convertirá automáticamente al formato
                  estándar `.jpg` para una máxima compatibilidad web y
                  eficiencia de almacenamiento. Las transparencias se rellenan
                  con fondo blanco.
                </p>
              </section>

              <section>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
                  Controles de Calidad y Resolución
                </h3>
                <p className="mb-2">
                  Ajusta la calidad de compresión (10%-100%) y/o limita la
                  resolución máxima de salida. Para aplicar estos ajustes a las
                  imágenes ya cargadas, haz clic en el botón{" "}
                  <strong>&quot;Procesar Cambios&quot;</strong>.
                </p>
              </section>

              <section>
                <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
                  Privacidad y Procesamiento
                </h3>
                <p className="mb-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200 flex gap-2">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>
                    <strong>100% Seguro:</strong> La compresión se realiza
                    íntegramente de forma local en tu navegador. Tus imágenes
                    nunca se envían a ningún servidor web.
                  </span>
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Footer corporativo */}
      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 px-6 py-3 text-center text-sm text-neutral-600 dark:text-neutral-400">
        <a
          href="https://www.loeramsoft.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#63048C] dark:hover:text-[#b855e8] transition-colors"
        >
          Loeram Software Solutions
        </a>
      </footer>
    </div>
  );
}

export default App;
