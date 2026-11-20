# Reglas de estilos del equipo

Hay **un solo CSS global**: `src/styles/global.css`, importado **una vez** en `main.jsx`.
Todo lo demás es CSS de módulo, aislado bajo su propia clase raíz.

## 1. Qué vive en `global.css` (y solo ahí)
- **Fuentes y variables** (`:root`): `--fuente-texto`, `--fuente-titulo`, colores, radios, sombras, z-index.
  Hoy ambas fuentes son **Arimo**; para cambiarlas se edita solo esa línea.
- **Base**: `body`, `h1-h6`, `a`, `button`, `input`, `select`, `textarea`, `img`, `ul`.
- **Layout**: `<Sidebar/>` + `<Header/>` + `<main class="contenido-principal">` (lo pinta `PanelLayout`).
  Un módulo **nunca** pone `margin-left`, `margin-top` ni `min-height: 100vh` en su raíz:
  ya lo aplica `.contenido-principal`.
- **Componentes compartidos con prefijo `ui-`**: `.ui-toast`, `.ui-contenido`, `.ui-sr-only`, `.ui-oculto`.
  Además: `.ui-tabs` / `.ui-tab` / `.ui-tab--activa` / `.ui-tab__conteo` (pestañas), `.ui-acciones` / `.ui-accion--info|editar|peligro|ok` (botones de acción de tabla) y `.ui-bienvenida*` (aviso del primer ingreso).
- **Títulos**: `--peso-titulo` y `--fuente-titulo` definen la negrilla/tipografía de todos los h1-h6, `th` y textos con clase `*titu*`.
- **Modales**: todo `<dialog>` modal queda centrado, con `max-height` de pantalla y scroll interno, y nada (salvo `textarea`) se redimensiona con el mouse. No pongas `top/left/transform/height` fijos en un `dialog`.

## 2. Cada módulo, una clase raíz con prefijo
Cada página principal envuelve todo en su clase raíz y **todas** sus reglas CSS cuelgan de ella
(`:where(.adm-pagos) .tabla { … }`; `:where()` no sube la especificidad).

| Módulo | Raíz | Módulo | Raíz |
|---|---|---|---|
| admin/Cuentas | `.adm-cuentas` | atleta/Dashboard | `.atl-dashboard` |
| admin/Dashboard | `.adm-dashboard` | atleta/Horarios | `.atl-horarios` |
| admin/Horarios | `.adm-horarios` | atleta/Implementos | `.atl-implementos` |
| admin/Implementos | `.adm-implementos` | atleta/Pagos | `.atl-pagos` |
| admin/Pagos | `.adm-pagos` | atleta/PQRS | `.pqa-page` |
| admin/PQRS | `.pqrs-page` | atleta/Rendimiento | `.rend-atleta` |
| admin/Asistencia (y entrenador) | `.adm-asistencia` | entrenador/Dashboard | `.de-pagina` |
| admin/Rendimiento | `.adm-rendimiento` | entrenador/Horarios | `.ent-horarios` |
| Perfil | `.perfil-pagina` | Landing / Auth | `.pagina-landing` / `.pagina-auth` |

## 3. Prohibido
- Selectores por **ID** para dar estilos (usa una clase con prefijo del módulo). Los `id` quedan solo para
  `label for`, anclas (`#hero`) y accesibilidad.
- Clases genéricas sin prefijo (`.modal`, `.card`, `.btn`, `.tabla`, `.header`, `.container`…) y selectores de
  etiqueta sueltos (`button {}`, `table {}`, `h2 {}`, `* {}`) en CSS de módulos.
- Declarar `font-family`, `:root`, `body`, `html` o resets fuera de `global.css`.
- Importar un CSS de otro módulo o usar sus clases. Si necesitas lo mismo en dos módulos, créalo con `ui-` en `global.css`.
- Poner estilos de Bootstrap-override (`.btn`, `.form-control`…) globales: acótalos a tu raíz.

## 4. Antes de crear una clase
Busca que el nombre no exista: `grep -rn "nombre-de-clase" src --include=*.css --include=*.jsx`.
Los nombres nuevos llevan el prefijo del módulo (`adm-pagos-…`).

## 5. Ojo: bloques "copiados" al final de algunos CSS
Varios CSS de módulo terminan (o empiezan) con un bloque *"Estilos de otros módulos que ya afectaban a este"*.
Son reglas que antes se filtraban por usar el mismo nombre de clase; se copiaron para que la pantalla
conserve su aspecto actual. Si el equipo quiere el aspecto "propio" del módulo, basta con borrar ese bloque.
