# Bloom Coffee & Brunch · Brief de traspaso (web, estado al 7-nov-2026)

Para empezar una conversación nueva sin partir de cero. Pégalo entero o pide a Claude Code que lea este archivo en el repositorio.

---

## 1. Cómo trabajamos

- Hablo en español. Claude Code me explica el plan, trabaja y me enseña capturas en móvil y escritorio.
- **No rediseñar desde cero.** Mejorar lo que hay, sin perder la identidad actual.
- Las fotos y vídeos los subo **como archivo** (las imágenes pegadas en el chat no se pueden guardar en la web).
- Cada cambio: commit + push a la rama y actualizar la vista previa (mismo enlace).

## 2. Dónde está todo

| Qué | Dónde |
|---|---|
| Repositorio | `sebaasgaviria3-source/Bloom-WEBSITE` |
| Rama de trabajo | `claude/sweet-davinci-thhdaj` (último commit: `f069191`) |
| Vista previa (pública con el enlace) | https://claude.ai/artifact/BpYxbMNzwF6aKvXabLi7iA |
| Archivos principales | `index.html`, `styles.css`, `main.js` |
| Librerías locales (`lib/`) | GSAP 3.13 + ScrollTrigger, Lenis 1.3.4, Swiper 11.2.10 |
| Fuentes locales (`assets/fonts/`) | Fraunces (títulos), Manrope (textos), Sacramento (manuscrita, casi sin uso) |
| Fotos originales | `assets/photos/source/gallery/` |
| Fotogramas de las tortitas | `assets/frames/pancake/lg` (1600 px) y `sm` (960 px), 80 cada uno |

Web estática HTML/CSS/JS, sin instalaciones ni build. Pensada para Hostinger (hay `.htaccess`).

## 3. Cómo es la web ahora (mantener)

**Estilo:** minimalista y profesional. Fondo crema único (`#F6EFE6`), blanco solo en los marcos de las fotos, beige y marrón café para el texto (`#3E2C23`). Acento rosa del logo apagado (`#9E5266`), solo en palabras en cursiva. Mucho espacio libre, líneas finas entre secciones, sin bloques de color, sin degradados, sin desenfoque y con sombras mínimas.

**Orden de la página:**
1. **Inicio:** logo de Bloom centrado y grande, con «Café de especialidad & brunch · Vigo» debajo. Debajo va la foto de las tortitas en un marco limpio. Al hacer scroll, la portada se queda fija y las tortitas se abren fotograma a fotograma (scroll-scrub: se para si paras y se cierra si subes). No se reproduce sola.
2. **Galería («Nuestros favoritos»):** carrusel Swiper con 10 fotos originales en marcos blancos, con su proporción original y sin recortar. Avance automático lento (4 s), flechas, contador, se desliza con el dedo, zoom suave al pasar el ratón y entrada escalonada.
3. **Nuestra historia:** foto de la sala y del osito en marcos blancos (el osito flota suavemente), con el texto de la historia.
4. **Carta:** Café · Bebidas e infusiones · Bollería · Para comer, con precios y un enlace a «Pide la carta completa» (WhatsApp).
5. **Contacto:** dirección y «Cómo llegar», horario con el día de hoy resaltado y el aviso Abierto/Cerrado (hora de Madrid), teléfono, WhatsApp, email e Instagram. Pie con el logo.

**Menú:** enlaces a ambos lados del logo (Galería · Historia | Carta · Contacto). El logo pequeño del menú solo aparece después de la portada. En el móvil, el logo va en el centro y el menú a la derecha.

**Animaciones:** suaves y discretas. Fundidos al aparecer, scroll suave con Lenis y todo desactivado si el usuario tiene activada la opción de reducir movimiento.

## 4. Datos del negocio

- **Bloom Coffee & Brunch**, Calle Ángel Llanos 10, 36203 Vigo (Pontevedra).
- Teléfono / WhatsApp: +34 640 24 01 76 · bloomcoffeeb@gmail.com · Instagram @bloom.coffee.vigo · dominio bloomcoffeebrunch.com
- Horario: lunes a viernes 9:00–22:00 · sábado 10:00–23:00 · domingo cerrado.
- Producto: café de especialidad, brunch, açaí, bollería, batidos, infusiones y sabores de Brasil (coxinhas, pan de queso, pastéis). En el local hay un gran osito rosa.

## 5. Decisiones tomadas

- La **carta es un PDF** (`carta-bloom.pdf`). Mientras no exista, los botones llevan a WhatsApp con el mensaje ya escrito. Cuando exista, basta con poner su nombre en `CARTA_PDF` en `main.js`.
- Se dice **«Carta»**, no «Menú».
- **No inventar** precios, reseñas ni datos. En la carta solo van los precios del brief que no estaban marcados como dudosos.
- **Nunca usar** fotos, textos ni logo de Santa Lyna (el vídeo de referencia). El bagel con salmón y las tortitas con sirope que mandé son suyos y **no se usan**.
- SEO hecho: título, descripción, canonical, Open Graph, datos de negocio (JSON-LD) y un solo H1.

## 6. Pendientes

1. **Texto definitivo de «Nuestra historia»** (el actual es provisional).
2. **Carta en PDF** y confirmar los precios dudosos (tostadas y brunch, batidos, coxinha, pastel de feria, chocolate con churros).
3. **Páginas legales** (aviso legal, privacidad y cookies): obligatorias en España. Todavía no hay enlaces.
4. **Fotos propias** de más platos (sobre todo de tortitas y brunch) para la galería.
5. Logo en **SVG o PNG transparente** de alta resolución, y el enlace real de la **ficha de Google Maps**.
6. Decidir si se recupera la **barra fija del móvil** (Llamar · WhatsApp · Llegar · Carta), que se quitó al hacer la página más minimalista.
7. Mejorar aún más la nitidez de las tortitas: la mejor opción es un vídeo nuevo grabado directamente, no la pantalla de un portátil. Otra opción es mejorarlo con Higgsfield (Topaz 4K), que gasta créditos.
8. Probar en un móvil real (iPhone y Android).

## 7. Skills instaladas en el repositorio

arrange, clarify, critique, distill, hierarchy, polish, typeset (better-web-ui), neon (no encaja con la paleta actual, no usar salvo para un detalle), además de las de GSAP, frontend-design, ui-ux-pro-max y webapp-testing.
