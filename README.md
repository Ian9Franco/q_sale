# 🎮 Q-Sale? (¿Qué Sale?)

**Q-Sale** es una Progressive Web App (PWA) moderna y táctica diseñada para coordinar partidas entre amigos, saber quién está disponible ya o a qué hora/día, si ya están en Discord, y armar la escuadra completa (5/5) para **Tom Clancy's Rainbow Six Siege** (con catálogo ampliable a otros juegos).

---

## ✨ Características Principales

- 📱 **PWA Instalable (Mobile & Desktop):** Podés anclar la web a la pantalla de inicio de tu celular (iOS / Android) y usarla como una app nativa en pantalla completa.
- ⚡ **Disponibilidad en Tiempo Real:** Marcá tu estado al instante:
  - 🟢 **Disponible YA** ("Sale ahora")
  - ⏳ **En 15-30 minutos**
  - 🕒 **A una hora o día específico** ("Hoy 22:30", "Mañana", etc.)
  - 🔴 **No puedo hoy**
- 🎙️ **Estado de Discord en Vivo:** Avisa si ya estás en el canal de voz, si estás entrando, o abre Discord con un solo toque.
- 🎯 **Squad Tracker de Rainbow Six Siege:**
  - Contador de 5 slots de escuadra.
  - Alerta visual y sonora táctica cuando se completa el equipo (5/5).
  - Selector de modo: Ranked 🏆, Standard 🛡️, Quick Match ⚡.
  - Operadores y roles tácticos (Ash, Sledge, Smoke, Jäger, Thermite, etc.).
- 🔄 **Sincronización Automática:** Todos tus amigos ven los cambios en tiempo real vía API interna.
- 🔊 **Efectos de Sonido Tácticos:** Alertas con Web Audio API al cambiar de estado o completar la escuadra.

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 3. Compilar para producción
```bash
npm run build
npm start
```

---

## 📱 Cómo Anclar la App a la Pantalla de Inicio del Celular

### 🍏 En iPhone (Safari):
1. Abre la web en Safari.
2. Toca el botón **Compartir** (icono de cuadrado con flecha hacia arriba).
3. Selecciona **"Agregar a Inicio"** (o *"Add to Home Screen"*).
4. Toca **Agregar**.

### 🤖 En Android (Chrome / Edge):
1. Abre la web en el navegador.
2. Toca los **tres puntos (⋮)** en la esquina superior derecha.
3. Selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.

---

## 🛠️ Tecnologías Utilizadas

- **Next.js 16 (App Router)** - Sin carpeta `src/`
- **React & TypeScript**
- **Vanilla CSS & Design Tokens** (Glassmorphism & Tactical Dark Theme)
- **Web Audio API** para efectos de sonido
- **Web App Manifest (PWA)**
