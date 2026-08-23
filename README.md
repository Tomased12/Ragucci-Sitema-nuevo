# Sastrería Ragucci - Sistema de Gestión & Rentabilidad

Sistema web profesional, moderno y responsivo diseñado a medida para **Sastrería Ragucci**. Permite gestionar órdenes de confección a medida, ventas de productos terminados (*Ready-To-Wear*), pagos a talleres y modistas, CRM de clientes y balance financiero en tiempo real.

---

## 🛠️ Tecnologías y Herramientas Utilizadas

* **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) (Empaquetador ultrarrápido).
* **Estilos & UI:** [Tailwind CSS](https://tailwindcss.com/) (Diseño responsivo con la paleta luxury institucional: `#190303` y `#c59f5e`).
* **Tipografías:** Google Fonts (*Bodoni Moda* para el título principal e *Fustat* para el resto de la interfaz amena y legible).
* **Base de Datos Cloud:** [Firebase Firestore v10](https://firebase.google.com/docs/firestore) (Sincronización en tiempo real de órdenes y configuraciones).
* **API Externa:** [DolarAPI](https://dolarapi.com/) (Consulta automática del Dólar Blue en tiempo real para calcular gastos de alquiler en ARS).
* **Iconografía:** [Lucide React](https://lucide.dev/) (Iconos limpios y modernos).

---

## 📋 Módulos del Sistema y Forma de Uso

### 1. ➕ Nueva Orden / Venta (Calculadora en Tiempo Real)
* **Datos del Cliente:** Autocompletado inteligente con búsqueda rápida y carga automática de teléfono, DNI, mail y cumpleaños a partir del historial. Navegación fluida por teclado (flechas `↑` `↓` y `Enter`).
* **Confección a Medida:** Selección de prenda con costo base automático (Santiago Sastre), recargo opcional de Talle Especial (+15%) y asignación de Camiseros (Diego / Guillermo).
* **Arreglos por Modista:** Asignación granular de trabajos a modistas (María, Jesús, Arturo) con tarifas configurables o arreglos personalizados (*custom*).
* **Productos Terminados (RTW) & Avíos:** Carga de productos de catálogo RTW, envíos, comisión de Tomy (10%) y empaque (perchas, fundas, bolsas de papel y plástico).
* **Live Calculator:** Muestra en vivo la Venta Total, Dinero Ingresado, Saldo a Cobrar, Costos Totales de Confección y Ganancia Teórica ($ y % Margen).

### 2. 📖 Registro General (Libro de Órdenes & CRM)
* **Filtros Avanzados:** Búsqueda por texto (cliente/producto), mes, año y estado de cobro (*Pendientes* vs. *Pagadas*).
* **Integración WhatsApp:** Enlace directo para abrir chat de WhatsApp (`wa.me`) con el cliente en un clic.
* **Alerta de Cumpleaños:** Distintivo animado cuando el cliente cumple años el día de la fecha.
* **Gestión de Pagos & Ficha:** Botón `+ Pago` para acreditar señas/saldos acumulados y modal con la ficha completa e historial de compras del cliente.

### 3. 👥 Control de Pagos a Talleres y Personal
* Desglose individualizado de tareas realizadas y montos adeudados a **Santiago (Sastre)**, **Diego y Guillermo (Camiseros)** y **María, Jesús y Arturo (Modistas)**.
* Checkboxes para marcar boletas pagadas/pendientes que tachan el ítem y recalculan el total a pagar en tiempo real.

### 4. 📈 Balance Financiero y Rentabilidad
* Tarjetas métricas: Venta Bruta Total, Saldo Pendiente a Cobrar, Dinero Real Ingresado y Ganancia Neta Real.
* Gastos Fijos Mensuales editables: Alquiler (USD convertido automáticamente a pesos según Dólar Blue), Expensas, Internet, Servicios, Redes y Publicidad.
* Tabla completa con el desglose de todos los costos del negocio.

### 5. ⚙️ Configuración (M.O)
* Matriz editable para actualizar en la nube los precios base de sastrería, camiseros, avíos, catálogo RTW y modistas.

### 6. 💾 Backup
* Descarga de copia de seguridad local en formato `.json` con todas las órdenes y configuraciones.

---

## 🔐 Configuración de Variables de Entorno (`.env`)

Las credenciales de Firebase deben configurarse en tu archivo `.env` local (ignorado en Git por seguridad):

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## ⚡ Guía de Comandos Rápidos

### 1. Iniciar servidor local de desarrollo:
```bash
npm run dev
```
*(Accede desde el navegador a `http://localhost:3000/`)*

### 2. Generar versión de producción:
```bash
npm run build
```

### 3. Publicar en Firebase Hosting (Despliegue a la web):
```bash
npx firebase login
npx firebase deploy
```
