# Torchlight — Scenes

Art direction for the five hand-painted vignettes, one per page type.

This document is the brief. It exists so the illustration can be commissioned,
generated or drawn by someone who has never seen the theme, and still come back
usable. Read [`design.md`](./design.md) for the system the scenes have to live
inside; §0 (Ash), §4 (gold budget) and §11 (motion) all constrain what follows.

**Status: deferred to v2.** The briefs below are complete and the decisions in
§4 and §5 are still open. Nothing here blocks the release — see
[`STATUS.md`](./STATUS.md) §7. Painting these programmatically was attempted
and rejected; §7 records why.

---

## 1. What a scene is, and is not

A scene is **one small painting in the bottom-right corner of a page, behind
the text**. It is atmosphere, not illustration of the content.

|             |                                   |
| ----------- | --------------------------------- |
| Position    | bottom-right, flush to both edges |
| Size        | `clamp(200px, 30vw, 420px)` wide  |
| Opacity     | ~0.55 hollowed, ~0.3 kindled      |
| Stacking    | behind all content (`z-index: 0`) |
| Below 900px | removed entirely, not faded       |
| Per page    | exactly one, or none              |

**The consequence that governs every brief below:** the reader sees this small,
dim, and partly behind a paragraph. It must read as a **shape first**. Interior
detail below roughly 2% of the frame width is wasted — it will not survive the
scale, and worse, it turns to noise, which the theme already spends its texture
budget on elsewhere.

If a scene needs its detail to be legible, the composition is wrong.

---

## 2. Shared constraints

Every scene must satisfy all of these. They are not stylistic preferences; each
one is load-bearing for something already built.

### Value

- **Keep the darkest 60% of the value range.** The page ground is `#1b1a17` and
  the scene composites over it. A mid-grey painting turns the corner of the page
  into a grey rectangle with visible edges.
- **One light source per scene, and it must be inside the frame or clearly
  implied by it.** The theme's whole lighting model is one source above the
  content (`design.md` §1). A scene lit from everywhere contradicts the page it
  sits on.
- **No pure black and no pure white.** Bottom out around `#0d0c0a`, top out
  around `#f4efde` and only in the light source itself.

### Colour

- **The sepia ramp is the palette**: `#1b1a17 · #38322b · #695442 · #a78a6d ·
#f4efde`. Desaturated warm brown, never cool grey — `design.md` anti-patterns.
- **Firelight may leave the ramp**, running ember red → orange → near-white core.
  Hue shift is what reads as heat; brightness alone does not.
- **No fourth hue.** The system has three: gold `--torch`, arcane teal
  `--arcane`, blood `--blood`. See §4 for the banner problem.

### The gold budget

`design.md` §4 allows **gold at most three times in a viewport**, counted, not
measured. The HUD flame is always one. A hovered link is usually another. So:

> **A scene may spend at most one gold.**

One lit window, or one fire, or one moon-catch. Not two lit windows and a fire.
If a scene needs more light sources than that, they must be the same light —
one fire throwing light on three surfaces is one gold.

### Edges

- **The scene must dissolve into the page on its top and left edges**, with no
  visible boundary. Alpha fade, or paint that simply runs out.
- **Bottom and right edges are flush** — the scene is cropped by the viewport,
  not floating in it. A vignette with four soft edges reads as a sticker.

### Delivery

| Property  | Value                                                         |
| --------- | ------------------------------------------------------------- |
| Source    | 2200 × 1650 (4:3), RGBA                                       |
| Delivered | WebP with alpha, ≤ 140 KB each                                |
| Naming    | `public/scenes/{approach,clerestory,court,rest,drowned}.webp` |
| Alpha     | required — the ground colour is a token, not baked in         |

---

## 3. The five scenes

### 3.1 Approach → **home**

> Castle exterior. Faint mist drifting. The castle's silhouette is readable
> through it. A stone-brick road runs from the foreground to the gate.

You are outside and you have not gone in. Seen once per visit, which is the
right frequency for the most illustrative of the five.

- **Composition:** the road enters bottom-left and leads the eye to the gate,
  which sits right of centre. The castle mass is the top-right two-thirds.
- **Light:** cold and high, behind the castle — the mass is a silhouette, and
  the mist is what is actually lit.
- **The mist does the work.** It separates the castle from the far towers, and
  it is the reason this scene can be dark without being flat. Two or three
  depths of it, not one.
- **Gold:** one lit window, small, in the gatehouse. It is the only warm thing
  and it is why the road is worth walking.
- **Avoid:** a symmetrical fairy-tale castle; a full moon (that belongs to
  Drowned); anything in the sky.

### 3.2 Clerestory → **listings** (posts, tags, archive)

> Castle interior. Light coming through the windows.

You are inside now. This is the page returned to most often, so it is the
quietest of the five — it has to survive being seen a hundred times.

- **Composition:** a hall running away from the viewer. Windows high on the
  right wall, so the shafts fall left across the floor. The far end is unlit.
- **Light:** the shafts _are_ the subject. Everything else is the dark they are
  visible against.
- **Gothic means the arch is pointed** — an ogive, two curves meeting at a
  point. Round arches read as romanesque and the scene loses its period.
- **Gold:** none. The shafts are pale, not gold; at low opacity they are
  atmosphere rather than accent. This is the one scene that spends nothing,
  which is deliberate — the page it sits on is the one with the most links.
- **Avoid:** stained glass colour; dust motes rendered as individual specks;
  any figure.

### 3.3 Court → **archive / tags**

> Gothic castle interior, solemn. Deep crimson banners, aged and worn, marking
> the decline of a royal house — but the feeling is still and dignified, not
> ruined.

Banners are heraldry, and tags are heraldry: this is the page where things are
sorted under standards. Read §4 before painting this one — the crimson is a
deliberate exception to a rule, not a free choice.

- **Composition:** banners hanging vertically, two or three, in a hall. They
  are the vertical rhythm; the architecture is secondary and can be barely
  implied.
- **The whole brief is "faded, not destroyed."** The cloth is worn thin, the
  edges are frayed, the dye has gone from blood to brick. Nothing is torn down.
  Dignity is the difference between this scene and a ruin.
- **Light:** flat and even, from high and behind — a hall no one is standing in.
  This is the only scene with no dramatic source, and that is the point:
  stillness is its subject.
- **Gold:** none, or a single thread of it in a banner's device.
- **Avoid:** cobwebs, skulls, rubble on the floor, anything that reads as
  haunted. Decline is not horror.

### 3.4 Rest → **about**

> A weary man in full armour, sitting beside a bonfire, resting.

The only scene with a person in it, on the only page with a person behind it.

**Reference:** Barry Allen, _Knight Resting at Bonfire_
(<https://displate.com/displate/7192913>) — dark armour, helmet set down on the
ground, sword leaning nearby, amber firelight against a cool dark surround. Take
the lighting and the posture from it; do not take the forest.

- **Composition:** the figure left of centre and seen from slightly above, so he
  reads as _sitting down_ rather than _sitting up_. Fire to his right, close
  enough that they overlap. Two objects evenly spaced across a frame read as two
  objects; overlapping ones read as a scene.
- **Posture is the whole subject.** Head down, shoulders forward, forearms on
  knees. Weariness lives in the angle of the spine and nowhere else.
- **Light:** the fire, low and to his right, catching the underside of the
  pauldron, the helm's brow, the knee. Everything the fire does not reach is
  near-black.
- **Gold:** the fire. That is the one, and it is enough.
- **Avoid:** a heroic pose; a face; a visible expression. He is anonymous —
  the reader is meant to be able to be him.

### 3.5 Drowned → **404**

> The ruins of a medieval building, and a lake with the moon reflected in it.

The reader has reached the end of the world. A shore is the right metaphor for
a page that does not exist.

- **Composition:** the waterline sits low, around 60% down. The ruin is
  mid-centre and **leaning** — the lean is what makes it corrupt rather than
  merely old. Moon high right; its reflection is directly below it, which means
  the moon cannot be near the frame edge or the reflection falls out of frame.
- **The reflection must not be a mirror copy.** It is broken into horizontal
  bands and displaced sideways, because that is how a reflection survives on
  moving water. Cold, and softer than the thing it reflects.
- **Light:** the moon. Cold. The only scene of the five that is not warm, which
  is what makes it the ending.
- **Gold:** one, and it is optional — a single lit window high in the ruin,
  the last thing still burning. If it weakens the cold, cut it.
- **Avoid:** a perfect mirror; a huge moon; birds.

---

## 4. The crimson problem — decide before painting Court

`tokens.json` defines `--blood` (`#c2705e` hollowed) and its role says, exactly:

> semantic only: danger, removed, deprecated, breaking. **Never decorative.**

A crimson banner is decorative use of `--blood`. It does not add a fourth hue,
so `design.md` §2 invariant 3 is safe — but it does break the role.

**Recommendation: allow it, scoped to the scene layer only.** The reasoning:

1. A royal house's colour going from blood to brick is _the theme's own subject_
   — decline, and light going out of things. Refusing it protects the letter of
   a rule at the cost of its point.
2. The scene layer never carries meaning. Nothing in it is clickable, labelled,
   or a state. The reason `--blood` is semantic-only is so a reader never has to
   ask whether red means danger; inside a painting behind the text, that
   question cannot arise.
3. It is one page.

**If allowed, the rule becomes:** `--blood` is semantic in the interface and
free in the scene layer, and no scene but Court may use it. That sentence goes
into `design.md` §4 as an amendment, not as a silent exception.

**If refused,** paint the banners in the sepia ramp's darkest browns. They will
read as very dark red-brown and lose almost nothing — this scene survives the
refusal better than most would.

---

## 5. Two worlds

The scenes are night scenes lit by one source. The kindled world is Anor Londo
at noon and has no equivalent, which is a real problem and not a detail.

Three options, in the order I would try them:

1. **Hollowed only.** Kindled gets no scenes. Cheapest, honest, and defensible:
   the vignettes are the dark world's atmosphere, and the bright world does not
   need atmosphere because it has light. **Recommended for the first pass.**
2. **A second painting per scene**, lit from a window instead of a fire. Twice
   the art, and the Rest scene has no daylight version that means anything — a
   knight resting by a fire at noon is a man sitting on the floor.
3. **One painting, recoloured.** Deliver luminance only and use it as a
   `mask-image` over a token-coloured layer, exactly as the SVG version does.
   Free recolouring, but the firelight's hue shift is lost, and that hue shift
   is most of what makes the Rest scene work.

---

## 6. Acceptance checks

A delivered scene is done when all of these pass:

- [ ] Legible as a shape at 200px wide, at 55% opacity, over `#1b1a17`.
- [ ] No visible edge on the top or left; flush on bottom and right.
- [ ] At most one gold, counted as light sources, not as lit surfaces.
- [ ] Darkest 60% of the value range; no pure black, no pure white.
- [ ] No cool grey anywhere.
- [ ] ≤ 140 KB WebP with alpha.
- [ ] Placed behind a real paragraph of body copy and still readable — both the
      paragraph and the scene.
- [ ] Nothing in it is clickable-looking.

---

## 7. Why painting these programmatically was rejected

A painting program was written and then deleted. It is recorded here because
the finding is worth more than the code was, and because the idea is an
appealing one to have again.

It composed each scene as volumes into a value field, then threw the field away
and repainted it as ~145,000 tapered brush strokes: rim lighting taken from the
gradient of blurred coverage, atmospheric perspective from a depth channel, and
a separate hue ramp for firelight, since hue shift rather than brightness is
what the eye reads as heat. Four scenes in about seven seconds, deterministic.

**It produced usable architecture and unusable figuration.** Drowned and
Approach both read as pictures. Rest came out as a boulder beside a cross,
through three iterations — and the gap was not one more iteration wide.
Stacking ellipses does not produce a seated human; a figure needs anatomy, and
that is exactly where a painting _program_ hits its ceiling.

**Claude Design is included in the Pro plan and is the tool for this work.** The
briefs in §3 are written to be handed to it directly.

If something like the painter is ever wanted again, the case for it is narrow
and specific: assets that must be deterministic, re-runnable, and coloured
straight out of `tokens.json` — backgrounds and atmosphere, not subjects.
