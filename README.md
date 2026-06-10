# LSS Compresor de Imágenes

Una herramienta web premium, rápida y 100% privada para comprimir, redimensionar y convertir múltiples imágenes a formato JPG en lote de forma local en el navegador.

Esta aplicación pertenece al grupo de soluciones internas LSS y hereda el mismo lenguaje de diseño y controles corporativos de la suite de herramientas.

---

## Características Principales

* **Procesamiento Masivo (En Lote)**: Arrastra y suelta (drag-and-drop) o selecciona múltiples imágenes simultáneamente para procesarlas en paralelo.
* **Conversión Nativa a JPG**: Convierte automáticamente formatos PNG, WEBP, GIF y BMP a formato estándar `.jpg` para mayor compatibilidad. Las transparencias se rellenan automáticamente con un fondo blanco limpio.
* **Nivel de Compresión Ajustable**: Slider interactivo para regular la intensidad de compresión de forma visual (Mínimo a Máximo).
* **Escala por Porcentaje**: Reduce proporcionalmente el ancho y alto de tus imágenes por factor de escala (del 10% al 100%).
* **Límite de Ancho/Alto**: Configura un tamaño máximo opcional (Full HD, HD, Móvil) para redimensionar de forma inteligente respetando la relación de aspecto.
* **Descarga Rápida o Masiva (ZIP)**: Descarga imágenes de forma individual o empaquetadas en un único archivo comprimido `.zip` generado localmente.
* **Privacidad Absoluta**: La compresión se realiza en su totalidad del lado del cliente mediante la API de `<canvas>` del navegador. Tus imágenes nunca se transmiten ni suben a ningún servidor web.
* **Diseño Premium y Oscuro**: Interfaz reactiva con soporte dinámico y persistente para tema claro/oscuro (sincronizado con la suite LSS a través de `localStorage`).

---

## Requisitos de Entorno

* **Node.js**: Versión 18 o superior recomendada.
* **Gestor de paquetes**: `pnpm` (recomendado) o `npm`.

---

## Comandos de Desarrollo

### 1. Instalar Dependencias
Instala los paquetes necesarios del proyecto (incluye soporte de compresión con Canvas, Lucide React para iconografía y JSZip para compresión local):
```bash
pnpm install
```

### 2. Ejecutar Servidor Local
Inicia el entorno de desarrollo con recargado rápido en tiempo real (HMR):
```bash
pnpm run dev
```

### 3. Compilar para Producción
Genera el compilado estático optimizado en la carpeta `dist/` listo para distribución:
```bash
pnpm run build
```

### 4. Vista Previa de Producción
Previsualiza de forma local el compilado final de producción:
```bash
pnpm run preview
```
