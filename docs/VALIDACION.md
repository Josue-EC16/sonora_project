# Validación del MVP SONORA

## Alcance

Pruebas locales en Chrome headless sobre HTTP estático. Se verificaron servicios y componentes mediante `tests/index.html` y los flujos reales mediante navegación y controles del navegador. La revisión visual utilizó capturas de Inicio y Administración en escritorio, e Inicio en móvil.

La solución productiva propuesta utiliza una arquitectura de microservicios con comunicación orientada a eventos y patrón API Gateway. Debido al alcance académico del proyecto, el MVP implementa una representación modular de dichos conceptos dentro del navegador utilizando JavaScript ES6+, una fachada central que emula el API Gateway, servicios independientes y un Event Bus interno basado en Publish/Subscribe. No se implementan microservicios distribuidos reales, infraestructura cloud ni una base de datos productiva.

## Resultado de la ejecución

- **51/51 pruebas automatizadas correctas, cero fallos.**
- **38 comprobaciones de navegación e interacción correctas** en Chrome con un perfil aislado de prueba y persistencia real en LocalStorage.
- Acceso administrativo bloqueado para USER, reproducción de los tres tipos, formularios de alta/edición y conservación de registros históricos verificados.
- Vistas USER, Login y todas las secciones ADMIN sin desbordamiento horizontal del documento a **320 px**. También se revisaron Inicio a **390 × 844** y escritorio a **1440 × 1000**.
- Menú móvil, tamaño del modal y cierre con Escape verificados.
- **Sin errores JavaScript ni recursos faltantes** durante el recorrido real.

Estas cifras describen la ejecución local realizada, no una garantía para todos los navegadores o configuraciones.

## Pruebas automatizadas reproducibles

Abrir `tests/index.html` mediante el servidor estático. El runner muestra cada prueba y el total. Su StorageService utiliza un adaptador en memoria, sin escribir datos de demostración en LocalStorage.

Cobertura:

- Semilla y campos del catálogo, inicialización no destructiva.
- Credenciales, roles, sesión, cierre y permisos del gateway.
- Búsqueda, filtros y contenido deshabilitado.
- Alta, edición y validaciones administrativas.
- Publish/Subscribe, desuscripción y errores de suscriptores.
- Reproducciones, deduplicación, progreso, cola, finalización y restauración.
- Aislamiento y orden del historial.
- Preferencias, puntuación, repetición y recomendaciones.
- Tarifas, precisión entera, historial monetario y tipos sin regalías.
- Métricas y conteos derivados coherentes.
- StorageService y formatos.
- DOM del login, dashboard, catálogo, reproductor, historial, perfil y ADMIN.



## Matriz de aceptación de navegación


| Caso | Acción                              | Resultado esperado                                      |
| ---- | ----------------------------------- | ------------------------------------------------------- |
| A01  | Abrir `index.html` sin sesión       | Redirección a Login                                     |
| A02  | Introducir contraseña incorrecta    | Mensaje de error, sin sesión                            |
| A03  | Iniciar como Marcelo                | Dashboard USER con saludo                               |
| A04  | Abrir `admin.html` como USER        | Redirección al dashboard USER                           |
| A05  | Filtrar Música y buscar Luces       | Una coincidencia                                        |
| A06  | Reproducir la coincidencia          | Player actualizado, un registro persistido              |
| A07  | Pausar y reanudar                   | Se conserva un único registro                           |
| A08  | Navegar a Historial                 | La escucha persiste                                     |
| A09  | Navegar a Perfil                    | Estadística personal de una reproducción                |
| A10  | Abrir menú móvil                    | Sidebar visible, cierre mediante overlay                |
| A11  | Cerrar sesión                       | Sesión eliminada y Login visible                        |
| A12  | Iniciar como Alex                   | Dashboard ADMIN sin player                              |
| A13  | Abrir Regalías                      | Tarifa de la canción y aviso ficticio                   |
| A14  | Agregar una canción                 | Aparece en catálogo y persiste                          |
| A15  | Editar una canción                  | Cambios visibles y persistidos                          |
| A16  | Deshabilitar la canción             | Estado administrativo actualizado                       |
| A17  | Abrir Usuarios                      | Tres usuarios y un administrador                        |
| A18  | Abrir Reproducciones                | Instantánea original conservada tras editar             |
| A19  | Abrir Métricas                      | Totales coinciden con actividad                         |
| A20  | Volver a USER                       | Contenido deshabilitado oculto; nuevo contenido visible |
| A21  | Revisar historial deshabilitado     | Se conserva la fila, replay desactivado                 |
| A22  | Reproducir podcast y audiolibro     | Ambos se registran; no generan regalías                 |
| A23  | Revisar escritorio 1440 × 1000      | Navegación, KPI y player utilizables                    |
| A24  | Revisar móvil 390 × 844 y 320 × 700 | Sin desbordamiento horizontal de la página              |
| A25  | Revisar consola y recursos          | Sin errores JavaScript ni recursos faltantes            |
