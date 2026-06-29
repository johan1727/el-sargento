# Avatares de los 4 sargentos

Genera 4 PNG **cuadrados** (recomendado 512×512), **mismo estilo** (cómic / cel-shaded,
contornos negros gruesos, colores planos saturados), encuadre cabeza-y-hombros,
personaje centrado de frente, **fondo sólido** del color del sargento, **SIN texto**.

Guárdalos exactamente como:

- `assets/sargentos/gomez.png`
- `assets/sargentos/rex.png`
- `assets/sargentos/valentina.png`
- `assets/sargentos/fabianski.png`

Luego, en `src/components/SergeantAvatar.tsx`, descomenta el bloque `AVATARS` con los
`require(...)` (ya está listo, son 4 líneas). El componente usa el PNG automáticamente.

> Nota: Canva (`generate-design`) estaba en **límite de cuota** al intentarlo. Cuando se
> reponga tu cupo, puedo generarlos yo con la integración de Canva. También sirve
> cualquier generador (Magic Media, etc.) con estos prompts.

---

## Prompts (en inglés, dan mejor resultado)

**Estilo común (pega al inicio de cada uno):**
> Comic book / cel-shaded cartoon character avatar, head and shoulders, facing forward,
> bold thick black outlines, flat saturated colors, centered, NO text, NO letters.

### gomez.png — Sargento Gómez 🇲🇽 (verde militar + dorado, fondo `#1B3A2F`)
> Tough but fair old-school Mexican army drill sergeant. Olive-green uniform with golden
> insignia, peaked military cap, thick black mustache, weathered serious honorable face,
> tan skin. Solid dark green background.

### rex.png — Sergeant Rex 🇺🇸 (azul marino + rojo, fondo `#0F1F4D`)
> Loud US Marine drill instructor, extremely intense expression, mouth open shouting,
> navy-blue uniform with red accents, square jaw, very short military buzzcut, campaign
> hat. Solid navy-blue background.

### valentina.png — Capitana Valentina 💅 (magenta + negro, fondo `#1A1A1A`)
> Elegant, glamorous and lethal elite female military captain. Calm condescending smirk,
> flawless makeup, magenta-and-black stylish uniform, sleek hair, confident posture.
> Solid near-black background with magenta rim light.

### fabianski.png — Sargento Fabianski 🌈 (morado + rosa, fondo `#4C1D95`)
> Warm but dramatic male sergeant, theatrical telenovela expression (hand on heart),
> purple uniform with pink accents, expressive eyes, slight beard. Solid purple background.
