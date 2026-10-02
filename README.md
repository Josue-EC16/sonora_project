# SONORA (SPOTIFY) — MVP

Caso **Spotify: sistema de streaming de música y podcasts**. Integra música, podcasts y audiolibros en una interfaz oscura con roles, reproducción simulada, recomendaciones, historial, regalías ficticias y analítica.

**Todos los usuarios, artistas, títulos, portadas, popularidad inicial y tarifas son ficticios.**

## 1. Objetivo y contexto.

El caso identifica recomendaciones poco precisas, interrupciones de reproducción, contenido poco integrado, dificultades con regalías, poca adaptación regional y falta de monitoreo. Este MVP demuestra los flujos de integración, personalización, registro, cálculo y consulta de métricas. **No resuelve streaming adaptativo, disponibilidad distribuida ni monitoreo de calidad de red.**

## 2. Stack.

- HTML5 y CSS3.
- JavaScript ES6+.
- LocalStorage del navegador.
- Datos iniciales en JavaScript y portadas SVG originales locales.
- Pruebas en navegador sin frameworks, paquetes, ni dependencias.



## 3. Cómo ejecutar.



### Opción recomendada: Live Server

1. Abrir esta carpeta en Visual Studio Code.
2. Tener instalada la extensión **Live Server**. Solo sirve archivos estáticos; no es un backend de la aplicación.
3. Hacer clic derecho en `index.html` → **Open with Live Server**.
4. Utilizar la dirección HTTP local que muestra la extensión, por ejemplo `http://127.0.0.1:5500/`.
5. Iniciar sesión con una cuenta de demostración.

También se puede usar cualquier servidor de archivos estáticos ya disponible en el entorno. No es necesario instalar paquetes del proyecto ni ejecutar un proceso de compilación.

**No abrir con doble clic mediante** `file://`**.** Los módulos ES6 pueden ser bloqueados por el navegador. HTTP local es necesario para su carga normal; no implica un backend ni acceso a Internet. Con la herramienta estática instalada, el MVP funciona sin conexión a Internet mientras el servidor local siga activo. No se instala un service worker ni se garantiza ejecución con el servidor apagado.

Utilizar una versión moderna de Chrome, Edge o Firefox que admita módulos, LocalStorage y `<dialog>`. Mantener el mismo host y puerto: `localhost` y `127.0.0.1`, o puertos diferentes, tienen almacenamientos independientes.

### Credenciales ficticias


| Rol   | Nombre    | Correo                    | Contraseña | Región    |
| ----- | --------- | ------------------------- | ---------- | --------- |
| USER  | Marcelo   | `user@spotify.local`      | `user123`  | Colombia  |
| USER  | Valentina | `valentina@spotify.local` | `user123`  | México    |
| USER  | Diego     | `diego@spotify.local`     | `user123`  | Argentina |
| ADMIN | Alex      | `admin@spotify.local`     | `admin123` | Colombia  |


Los botones **Usar** completan el formulario: no inician sesión automáticamente. Las contraseñas están en texto claro en los datos de prueba y LocalStorage. **No usar credenciales reales; esta autenticación no es segura ni apta para producción.**

## 4. Aclaración arquitectónica.

> La solución productiva propuesta utiliza una arquitectura de microservicios con comunicación orientada a eventos y patrón API Gateway. El MVP implementa una representación modular de dichos conceptos dentro del navegador utilizando JavaScript ES6+, una fachada central que emula el API Gateway, servicios independientes y un Event Bus interno basado en Publish/Subscribe. No se implementan microservicios distribuidos reales, infraestructura cloud ni una base de datos productiva.



### Representación modular

```text
HTML + CSS + controladores de página + componentes UI
                         │
                         ▼
                js/gateway/api-gateway.js
                         │
          ┌──────────────┼────────────────┐
          ▼              ▼                ▼
        Auth          Catálogo       Reproducción
                                          │
                                          ▼
                                  content.played
                                          │
                                  Event Bus interno
                           ┌────────┬─────┼─────────┐
                           ▼        ▼     ▼         ▼
                       Historial Regalías Preferencias Analítica
                           │                │         │
                           └───────────► Recomendaciones
                                                     │
                                                 Dashboards
```

Los módulos son independientes en **responsabilidad**, no procesos ni despliegues independientes. Comparten el navegador y LocalStorage.

### API Gateway

`js/gateway/api-gateway.js` construye los servicios y centraliza autenticación, permisos, consultas y comandos. La UI y los guards no importan servicios de negocio ni acceden a LocalStorage directamente.

"ADMIN" puede ejecutar `getUsers()`, `getArtists()`, `saveContent()`, `setContentEnabled()` y `getRoyalties()`. Las verificaciones de rol están en el gateway, además de los guards de página. `getSession()` y `login()` son las operaciones públicas previas a autenticación.

### Publish/Subscribe

`js/events/event-bus.js` ofrece `on(nombre, callback)` y `emit(nombre, datos)`. `on()` devuelve una función para cancelar la suscripción. Los servicios se registran una vez al construir el gateway.

Cuando `PlaybackService` inicia una reproducción válida emite `content.played` con un ID único, usuario, ID y copia de los datos del contenido, tarifa y fecha ISO. Reaccionan:

1. **HistoryService:** agrega el registro al historial.
2. **RoyaltyService:** registra la tarifa de una canción.
3. **RecommendationService:** reconstruye y persiste las afinidades del usuario desde su historial.
4. **AnalyticsService:** emite `data.updated` para actualizar las vistas. Sus métricas se calculan a demanda desde los registros, no desde contadores duplicados.

Historial y regalías reconocen el ID del evento para evitar duplicaciones. Las preferencias se reconstruyen desde el historial, por lo que tampoco se inflan si llega el mismo evento otra vez.

Otros eventos: `player.changed` actualiza el reproductor; `catalog.updated` informa cambios administrativos. La UI escucha estos eventos **a través del gateway**.

**El bus es síncrono y local.** Representa el desacoplamiento de Publish/Subscribe, pero no una cola asíncrona distribuida, un broker, garantías transaccionales, reintentos ni entrega entre procesos. Si un suscriptor falla, el bus notifica a los demás y comunica el error; LocalStorage no ofrece transacciones entre claves.

## 5. Funcionalidades.


| ID  | Funcionalidad      | Demostración                                                          |
| --- | ------------------ | --------------------------------------------------------------------- |
| F01 | Login y roles      | Sesión persistente, logout, USER/ADMIN, guards y permisos del gateway |
| F02 | Catálogo integrado | 18 canciones, 5 podcasts, 5 audiolibros; búsqueda y filtros           |
| F03 | Reproducción       | Play, pausa, reanudación, anterior, siguiente, progreso y duración    |
| F04 | Historial          | Registro automático, orden reciente primero y aislamiento por usuario |
| F05 | Recomendaciones    | Puntuación por preferencias iniciales, historial y región             |
| F06 | Regalías           | Tarifa ficticia por escucha musical, registro histórico y acumulados  |
| F07 | Dashboards         | Estadísticas personales y métricas administrativas                    |




### USER

Inicio con saludo, recomendaciones, recientes, categorías y popularidad; catálogo con búsqueda por título, creador, álbum, categoría y episodio; filtros por tipo, categoría y región; historial, perfil y estadísticas. Reproductor inferior compartido visualmente entre páginas.

### ADMIN

Dashboard con usuarios, cuentas, canciones, podcasts, audiolibros, artistas, reproducciones, regalías, contenido más reproducido, géneros y actividad reciente. Secciones para catálogo, usuarios, reproducciones, regalías y métricas. Puede agregar, editar y habilitar/deshabilitar contenido; los artistas se muestran en Contenido. Usuarios es una vista de consulta, no un sistema de gestión de cuentas.

## 6. Reglas de negocio.


| Regla | Implementación                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------- |
| RN01  | Solo usuarios autenticados acceden a operaciones de plataforma y páginas privadas.             |
| RN02  | Solo ADMIN accede a `admin.html` y las operaciones administrativas.                            |
| RN03  | Cada reproducción válida registra usuario, contenido, tipo y fecha/hora.                       |
| RN04  | Cada canción reproducida genera una regalía ficticia, que puede ser cero si su tarifa es cero. |
| RN05  | Las recomendaciones utilizan el historial y las preferencias del usuario.                      |
| RN06  | USER no puede listar, consultar ni iniciar contenido deshabilitado.                            |
| RN07  | Dashboards y contadores de reproducciones se calculan desde registros almacenados.             |
| RN08  | Acceder directamente a una página de otro rol redirige al inicio autorizado.                   |




### Qué cuenta como reproducción

- Se registra **al iniciar una nueva escucha**, no al completar un umbral de segundos.
- Seleccionar una tarjeta o usar anterior/siguiente inicia una nueva escucha.
- Pausar, reanudar y mover el progreso dentro de la misma escucha **no** crean otro evento.
- El contenido termina al alcanzar su duración; no avanza automáticamente.
- Reproducir después de finalizar inicia una nueva escucha.
- Anterior/siguiente recorren circularmente la cola del bloque seleccionado, omitiendo contenido deshabilitado.
- Sin cola previa, los controles permiten recorrer el catálogo disponible.
- Al navegar o recargar se recuperan contenido y progreso **en pausa**; no existe reproducción continua entre documentos.
- El estado se conserva por usuario. Cerrar sesión detiene el temporizador.

La historia conserva una instantánea: editar o deshabilitar el contenido no altera las reproducciones anteriores. En el historial, contenido deshabilitado sigue visible pero tiene el botón de reproducción desactivado.

## 7. Recomendaciones.

Algoritmo determinista, sin Machine Learning:


| Criterio                                     | Puntos       |
| -------------------------------------------- | ------------ |
| Género musical favorito                      | +3           |
| Creador más escuchado                        | +2           |
| Categoría más escuchada                      | +2           |
| Región del usuario                           | +1           |
| Popularidad ficticia inicial de al menos 700 | +1           |
| Cada 3 escuchas del mismo contenido          | −1, hasta −3 |


Las afinidades favoritas se obtienen de frecuencias del historial. Los empates se resuelven por nombre. Sin historial se usan los géneros iniciales y la región de la cuenta. Se ordena por score, popularidad y finalmente ID; se muestra una razón explicativa. Solo se recomienda contenido habilitado.

La sección Popular en la demo combina popularidad inicial con actividad: `popularidad + 100 × reproducciones registradas`. La popularidad inicial no se suma a los contadores reales del dashboard.

> El sistema productivo utilizaría modelos de IA/ML. El MVP utiliza un algoritmo basado en reglas para demostrar el flujo funcional de personalización.



## 8. Regalías y analítica.

Para música: `regalía = tarifa ficticia vigente × nuevas reproducciones válidas`. Ejemplo: tres escuchas a `0.01 USD` generan `0.03 USD ficticios`. Podcasts y audiolibros no generan regalías en este modelo.

El cálculo usa enteros en millonésimas de USD (`MONEY_SCALE = 1000000`), con precisión de seis decimales. Cada registro conserva el ID de reproducción y la tarifa histórica: cambiar la tarifa solo afecta escuchas futuras. El panel agrupa por canción y muestra artista, número de escuchas, tarifas aplicadas y acumulado.

La analítica ofrece reproducciones por tipo, usuario, género y creador, títulos únicos, ranking de contenido y actividad reciente. El usuario ve solo sus escuchas; ADMIN ve las de todas las cuentas. Total de usuarios significa **tres cuentas USER**, mientras que total de cuentas incluye ADMIN. Los totales por tipo incluyen contenido deshabilitado; contenido disponible cuenta solo los habilitados.

No se calcula tiempo realmente consumido, tasas de finalización, calidad de audio, latencia ni interrupciones de red.

## 9. Persistencia.

Todas las claves tienen el prefijo `sonora-mvp:v1:`:


| Clave             | Datos                                        |
| ----------------- | -------------------------------------------- |
| `schemaVersion`   | Versión y marcador de inicialización         |
| `users`           | Cuentas ficticias y preferencias iniciales   |
| `catalog`         | Catálogo y cambios administrativos           |
| `session`         | Identificador del usuario y fecha de login   |
| `plays`           | Registro de reproducciones e historial       |
| `royalties`       | Registros monetarios ficticios por evento    |
| `preferences`     | Afinidades de cada usuario                   |
| `player:<userId>` | Contenido, progreso, cola e ID de la escucha |


La semilla se ejecuta solo al iniciar una instalación nueva, no al recargar. Los errores de lectura/escritura se informan al usuario. Las métricas y conteos del catálogo son derivados; no se guardan como una segunda fuente de verdad.

### Reiniciar la demostración

**Esto borra únicamente los datos de este MVP en el origen actual.** Si necesitas conservar actividad o cambios, no lo ejecutes. En la consola del navegador:

```javascript
Object.keys(localStorage)
  .filter(key => key.startsWith('sonora-mvp:v1:'))
  .forEach(key => localStorage.removeItem(key));
location.href = 'index.html';
```

Alternativamente borrar los datos del sitio desde el navegador. Esto puede eliminar también otros datos de ese origen. La siguiente carga recrea la semilla.

## 10. Estructura

```text
caso_8_spotify/
├── index.html                 # Redirección según sesión y rol
├── login.html
├── dashboard.html
├── catalog.html               # Incluye filtros y vista de recomendaciones
├── history.html
├── profile.html
├── admin.html                 # Secciones mediante ?section=...
├── css/
│   ├── main.css               # Entrada de estilos
│   ├── variables.css
│   ├── reset.css
│   ├── layout.css
│   ├── components.css
│   ├── pages.css
│   └── responsive.css
├── js/
│   ├── app.js                 # Inicio, guards y coordinación
│   ├── gateway/api-gateway.js
│   ├── events/event-bus.js
│   ├── storage/storage.service.js
│   ├── data/                  # users.js, catalog.js, seed.js
│   ├── services/              # Auth, catálogo, playback, historial,
│   │                          # recomendaciones, regalías y analítica
│   ├── guards/                # auth.guard.js, role.guard.js
│   ├── pages/                 # Controladores pequeños por página
│   ├── ui/                    # Renderer, player, modal, notifications, icons
│   └── utils/                 # Constants, formatters, helpers
├── assets/
│   ├── icons/brand.svg
│   └── images/                # albums, artists, podcasts, audiobooks
├── tests/
│   ├── index.html
│   └── tests.js
├── docs/
│   └── VALIDACION.md
└── README.md
```

No se necesita carpeta de audio: la reproducción es un temporizador. La carpeta adicional `js/pages/` evita concentrar lógica de interfaz en `app.js`. No hay módulos vacíos ni pseudocódigo.

## 11. Pruebas y validación.

Con el servidor estático activo, abrir `tests/index.html` en el mismo origen. Ejecuta **51 pruebas** de servicios, gateway, eventos, persistencia, recomendaciones, regalías y componentes UI. El resultado aparece en pantalla. Los datos de prueba se almacenan **en memoria**, sin cambiar el LocalStorage de la demostración.

Las pruebas DOM montan los controladores con un gateway de prueba. No sustituyen la validación de navegación real ni de diseño responsive. Consultar `docs/VALIDACION.md` para la matriz manual y el resultado de la revisión de flujos reales en Chrome.

## 12. XP - Extreme Programming.

Desarrollo organizado en pequeñas entregas:


| Iteración | Alcance                                                        |
| --------- | -------------------------------------------------------------- |
| 1         | Estructura, datos, almacenamiento, estilos base, login y roles |
| 2         | Catálogo, búsqueda, filtros y gestión administrativa           |
| 3         | Reproductor, Event Bus, historial y persistencia del estado    |
| 4         | Preferencias y recomendaciones por puntuación                  |
| 5         | Regalías, analítica, métricas y dashboards                     |
| 6         | Pruebas, refactorización, responsive y documentación           |




## GRACIAS POR LEER

MARCELO JOSUE ESCOBAR CHIPANA