# Política de Seguridad

## Qué es NetPhantom

NetPhantom genera y aloja **laboratorios de ciberseguridad deliberadamente
vulnerables** con fines educativos (CTF, hacking ético). Esto significa que,
por diseño, las máquinas que genera o importa contienen fallos de seguridad
intencionados. **Úsalo solo en local, con Docker, en un equipo que controles
tú y en redes aisladas** — nunca lo despliegues en un servidor compartido,
en producción, ni accesible desde Internet.

Para una descripción honesta de qué garantiza (y qué NO garantiza) el propio
código de la aplicación — no las máquinas CTF que genera — consulta la
sección **"Arquitectura de Seguridad"** del [README](README.md).

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad en la **aplicación NetPhantom en sí**
(el servidor Express, el frontend, el proceso de exportación/importación de
escenarios, etc. — no en las máquinas CTF vulnerables que genera, que son
vulnerables a propósito), repórtalo de forma privada escribiendo a:

**contacto@unfantasmaenelsistema.com**

Incluye, si es posible:
- Una descripción del problema y su impacto.
- Pasos para reproducirlo.
- Versión/commit afectado.

Por favor, no abras un issue público con detalles de explotación hasta que
haya habido tiempo razonable para valorar y, si aplica, corregir el
problema.

## Alcance

- ✅ Dentro de alcance: `server.ts`, el frontend en `src/`, los scripts
  `iniciar.bat`/`iniciar.sh`, la generación/validación de `docker-compose.yml`,
  la importación/exportación de escenarios.
- ❌ Fuera de alcance: las vulnerabilidades deliberadas dentro de las máquinas
  CTF generadas (esa es la propia naturaleza del producto), y vulnerabilidades
  en dependencias de terceros que ya tengan su propio proceso de reporte
  (repórtalas directamente al proyecto correspondiente).

## Enlaces

- Web: <https://www.unfantasmaenelsistema.com>
- Tienda (GhostApps): <https://ghostore.unfantasmaenelsistema.com>
- Academia: <https://ghostacademy.unfantasmaenelsistema.com>
