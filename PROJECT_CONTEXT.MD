# CONTEXTO DEL PROYECTO

## Nombre del Proyecto
Snake Web

---

# Visión

Construir un juego de Snake multijugador responsivo que pueda jugarse directamente desde el navegador.

El proyecto debe funcionar correctamente en:
- Escritorio
- Celulares
- Tablets

Y soportar:
- Juego en tiempo real
- Sistema de nombres de usuario
- Partidas públicas
- Salas privadas

---

# Alcance Inicial

## Fase 1
- Configuración inicial del proyecto
- Integración con GitHub
- Preparación del VPS
- Landing page estática

## Fase 2
- Juego local de Snake
- Renderizado con Canvas
- Controles responsivos

## Fase 3
- Arquitectura multijugador
- WebSockets
- Estado compartido del juego

## Fase 4
- Matchmaking
- Salas privadas
- Tabla de puntuaciones
- Personalización visual

---

# Infraestructura

## Editor de código
Visual Studio Code

## VPS
45.32.196.163

## Dominio
raulmarquez.online

## Repositorio en Github

https://github.com/markezz3/snake-web.git

## Estructura

E:\snake-web
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── server.js
├── package.json
├── README.md
├── PROJECT_CONTEXT.md
└── .gitignore

---

# Stack Planeado

## Frontend
- HTML
- CSS
- JavaScript

## Backend
- Node.js
- Express
- Socket.IO

## Deployment
- Nginx
- PM2

---

# Estándares de Desarrollo

- Commits limpios y descriptivos
- Arquitectura modular
- Diseño mobile-first
- Interfaces responsivas
- Código reutilizable

---

# Notas

El proyecto comenzará intencionalmente simple para:
- Facilitar mantenimiento
- Aprender progresivamente
- Construir una base sólida
- Escalar correctamente en el futurogit

---

# Estados

## 22 Mayo 2026

### Infraestructura
- Actualización de Ubuntu 24.04.4 LTS
- Instalación y configuración de Nginx
- Instalación de Node.js
- Instalación de PM2
- Instalación de Express

### Deployment
- VPS conectado al dominio:
  - https://raulmarquez.online/
- SSL activado mediante Certbot y Nginx

### Frontend
- Creación de landing page inicial "Hola Mundo!"

---

# Problemas Encontrados

## 22 Mayo 2026
- El puerto 3000 estaba bloqueado por firewall
- server.js estaba dentro de /public
- PM2 ya ejecutaba startup automáticamente
