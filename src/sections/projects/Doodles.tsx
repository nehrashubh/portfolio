/**
 * Margin sketches: what ends up in the corner of a notebook while you think
 * about something else. Most are a nod to a card on the deck (SpaceNet's
 * orbits, OneVoice's waveform, DBWorkout's database, a CTF flag), the rest to
 * the trade in general. Drawn in the same pale ink as the text and kept
 * faint, so the hands and the deck stay the subject.
 *
 * Static on purpose: plain strokes in small SVGs, drawn once behind the
 * canvas and never repainted. No filters, no animation.
 *
 * Freehand, not ruled. Every stroke comes from a seeded pen that bows its
 * lines, runs a little past its corners and never quite closes a circle, so
 * the sketches read as drawn rather than plotted, and are the same on every
 * load. Where each one sits is in projects.css.
 */
type Pt = readonly [number, number];

interface Sketch {
  solid: string[];
  /** Hidden edges, links, the slot a node has not been put in yet. */
  dashed?: string[];
  /** Busy wiring that would otherwise outweigh what it connects. */
  faint?: string[];
  filled?: string[];
}

/** mulberry32: small, and the same sequence for the same seed. */
function random(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const xy = ([x, y]: Pt) => `${x.toFixed(1)} ${y.toFixed(1)}`;

/** Through every point, rounding each corner: the corners become the control
 *  points of curves between the midpoints either side of them. */
function smooth(points: Pt[]): string {
  let d = `M${xy(points[0])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += `Q${xy(points[i])} ${xy([(x + nx) / 2, (y + ny) / 2])}`;
  }
  return `${d}L${xy(points[points.length - 1])}`;
}

/** Pulls both ends of a segment in, so an edge stops at a node's rim. */
function trim(a: Pt, b: Pt, by: number): [Pt, Pt] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [ux, uy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  return [
    [a[0] + ux * by, a[1] + uy * by],
    [b[0] - ux * by, b[1] - uy * by],
  ];
}

function pen(seed: number) {
  const r = random(seed);
  const shake = (k: number) => (r() - 0.5) * 2 * k;

  /** A straight line by hand: it bows a little, and unless it has to stop
   *  at something, runs past its ends. */
  const line = (a: Pt, b: Pt, overshoot = true): string => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const [ux, uy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const back = overshoot ? 0.4 + r() * 1.4 : 0;
    const past = overshoot ? 0.4 + r() * 2 : 0;
    const start: Pt = [a[0] - ux * back + shake(0.3), a[1] - uy * back + shake(0.3)];
    const end: Pt = [b[0] + ux * past + shake(0.3), b[1] + uy * past + shake(0.3)];
    const bow = shake(Math.min(1.4, len / 30));
    const mid: Pt = [(start[0] + end[0]) / 2 - uy * bow, (start[1] + end[1]) / 2 + ux * bow];
    return `M${xy(start)}Q${xy(mid)} ${xy(end)}`;
  };

  /** Corner to corner, each side its own stroke. */
  const polygon = (points: Pt[], closed = true): string[] =>
    points
      .slice(0, closed ? points.length : -1)
      .map((p, i) => line(p, points[(i + 1) % points.length]));

  /** An ellipse by hand: the radius wanders, and a full one runs on past
   *  where it started rather than meeting itself. `turn` tilts it. */
  const ring = (
    [cx, cy]: Pt,
    rx: number,
    ry = rx,
    { turn = 0, from = r() * Math.PI * 2, sweep = Math.PI * 2.12 } = {},
  ): string => {
    const steps = Math.max(10, Math.round((Math.max(rx, ry) * sweep) / 3));
    const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
    const wander = Math.min(0.8, Math.max(rx, ry) * 0.05);
    const phase = r() * Math.PI * 2;
    const drift = shake(Math.min(1.6, Math.max(rx, ry) * 0.08));
    const points: Pt[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = from + (sweep * i) / steps;
      const out = wander * Math.sin(a * 2 + phase) + (drift * i) / steps;
      const [x, y] = [(rx + out) * Math.cos(a), (ry + out) * Math.sin(a)];
      points.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
    }
    return smooth(points);
  };

  return { line, polygon, ring, shake, r };
}

type Pen = ReturnType<typeof pen>;

/** Where on a tilted ellipse an angle lands. */
function onEllipse([cx, cy]: Pt, rx: number, ry: number, turn: number, a: number): Pt {
  const [x, y] = [rx * Math.cos(a), ry * Math.sin(a)];
  return [cx + x * Math.cos(turn) - y * Math.sin(turn), cy + x * Math.sin(turn) + y * Math.cos(turn)];
}

/** Nodes and the edges between them, edges stopping at the rims. */
function graph(p: Pen, nodes: Pt[], edges: [number, number][], radius: number) {
  return {
    nodes: nodes.map((n) => p.ring(n, radius)),
    edges: edges.map(([a, b]) => p.line(...trim(nodes[a], nodes[b], radius + 1.5), false)),
  };
}

interface Doodle {
  name: string;
  size: Pt;
  sketch: Sketch;
}

function doodle(name: string, size: Pt, seed: number, draw: (p: Pen) => Sketch): Doodle {
  return { name, size, sketch: draw(pen(seed)) };
}

const DOODLES: Doodle[] = [
  // This site: the one thing on the deck that is itself three-dimensional,
  // with its width measured off underneath, the way a drawing would have it.
  doodle('cube', [100, 108], 11, (p) => {
    const front: Pt[] = [[16, 38], [60, 38], [60, 82], [16, 82]];
    const back = front.map(([x, y]): Pt => [x + 24, y - 22]);
    return {
      solid: [
        ...p.polygon(front),
        p.line(front[0], back[0]),
        p.line(front[1], back[1]),
        p.line(back[0], back[1]),
        p.line(back[1], back[2]),
        p.line(front[2], back[2]),
        p.line([16, 98], [60, 98], false),
        p.line([16, 93], [16, 103], false),
        p.line([60, 93], [60, 103], false),
      ],
      dashed: [p.line(back[3], back[0]), p.line(back[3], back[2]), p.line(back[3], front[3])],
    };
  }),

  // Plain geometry: an angle on a ruled base, and its theta.
  doodle('angle', [100, 80], 17, (p) => {
    const vertex: Pt = [12, 68];
    const opening = 0.78;
    return {
      solid: [
        p.line(vertex, [94, 68]),
        p.line(vertex, [12 + 80 * Math.cos(opening), 68 - 80 * Math.sin(opening)]),
        p.ring(vertex, 26, 26, { from: -opening, sweep: opening }),
        p.ring([48, 54], 3.2, 5),
        p.line([44.5, 54], [51.5, 54], false),
      ],
      faint: [30, 48, 66, 84].map((x) => p.line([x, 68], [x, 73], false)),
    };
  }),

  // SpaceNet: a planet, two orbits, and the links between the satellites.
  doodle('orbits', [120, 90], 23, (p) => {
    const c: Pt = [60, 45];
    const low = { rx: 52, ry: 14, turn: -0.28 };
    const high = { rx: 38, ry: 22, turn: 0.55 };
    const sats = [
      onEllipse(c, low.rx, low.ry, low.turn, 0.5),
      onEllipse(c, low.rx, low.ry, low.turn, 3.5),
      onEllipse(c, high.rx, high.ry, high.turn, 2.1),
    ];
    return {
      solid: [
        p.ring(c, 8),
        p.ring(c, low.rx, low.ry, { turn: low.turn }),
        p.ring(c, high.rx, high.ry, { turn: high.turn }),
      ],
      dashed: sats.map((s, i) => p.line(...trim(s, sats[(i + 1) % 3], 4), false)),
      filled: sats.map((s) => p.ring(s, 2.2)),
    };
  }),

  // OneVoice: two words' worth of waveform, with a breath between them.
  doodle('wave', [140, 56], 37, (p) => {
    const bars: string[] = [];
    const count = 23;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const word = t < 0.42 ? Math.sin((Math.PI * t) / 0.42) : t > 0.54 ? Math.sin((Math.PI * (t - 0.54)) / 0.46) : 0;
      const h = 2 + 40 * word * (0.45 + 0.55 * p.r());
      const x = 8 + t * 124;
      bars.push(p.line([x, 28 - h / 2], [x, 28 + h / 2], false));
    }
    return { solid: bars, dashed: [p.line([2, 28], [138, 28], false)] };
  }),

  // DBWorkout: a database, the way everyone draws one.
  doodle('database', [70, 92], 41, (p) => {
    const bands = [36, 57, 78];
    return {
      solid: [
        p.ring([35, 14], 25, 8),
        p.line([10, 14], [10, 78]),
        p.line([60, 14], [60, 78]),
        ...bands.map((y) => p.ring([35, y], 25, 8, { from: 0, sweep: Math.PI })),
      ],
    };
  }),

  // Security: a padlock, shut.
  doodle('lock', [70, 92], 53, (p) => {
    const shackle: Pt[] = [[20, 46], [20, 30]];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (Math.PI * i) / 12;
      shackle.push([35 + 15 * Math.cos(a) + p.shake(0.3), 30 + 16 * Math.sin(a) + p.shake(0.3)]);
    }
    shackle.push([50, 46]);
    return {
      solid: [
        // One stroke: the legs run straight on into the arc.
        smooth(shackle),
        ...p.polygon([[9, 44], [61, 44], [61, 86], [9, 86]]),
        p.ring([35, 60], 4.5),
        p.line([35, 66], [35, 75], false),
      ],
    };
  }),

  // Cyber Apocalypse: it is a capture-the-flag, after all.
  doodle('flag', [70, 100], 67, (p) => ({
    solid: [
      p.line([14, 96], [14, 6]),
      smooth([[14, 9], [26, 4], [38, 10], [50, 15], [61, 10], [60, 24], [59, 38], [47, 43], [35, 37], [24, 33], [14, 37]]),
      p.line([3, 96], [27, 96]),
    ],
  })),

  // CancerScan and OneVoice: three layers of a small network, fully wired.
  doodle('net', [110, 90], 79, (p) => {
    const layers = [[24, 45, 66], [12, 34, 56, 78], [34, 56]];
    const nodes: Pt[] = layers.flatMap((ys, l) => ys.map((y): Pt => [12 + l * 43, y]));
    const edges: [number, number][] = [];
    let first = 0;
    for (let l = 0; l < layers.length - 1; l++) {
      const next = first + layers[l].length;
      for (let a = 0; a < layers[l].length; a++)
        for (let b = 0; b < layers[l + 1].length; b++) edges.push([first + a, next + b]);
      first = next;
    }
    const g = graph(p, nodes, edges, 4.5);
    return { solid: g.nodes, faint: g.edges };
  }),

  // A binary tree with one slot still empty.
  doodle('tree', [120, 96], 83, (p) => {
    const nodes: Pt[] = [[60, 12], [30, 44], [90, 44], [14, 80], [46, 80], [74, 80], [106, 80]];
    const g = graph(p, nodes, [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]], 6);
    return {
      solid: [...g.nodes.slice(0, 6), ...g.edges.slice(0, 5)],
      dashed: [g.nodes[6], g.edges[5]],
    };
  }),

  // A branch off main, two commits, merged back.
  doodle('git', [140, 60], 97, (p) => {
    const nodes: Pt[] = [[12, 42], [40, 42], [82, 42], [126, 42], [60, 16], [98, 16]];
    const g = graph(p, nodes, [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [5, 3]], 4.5);
    return { solid: [...g.nodes.slice(0, 3), ...g.nodes.slice(4), ...g.edges], filled: [g.nodes[3]] };
  }),

  // A terminal, waiting.
  doodle('prompt', [100, 70], 101, (p) => ({
    solid: [
      ...p.polygon([[6, 8], [94, 8], [94, 64], [6, 64]]),
      p.line([6, 20], [94, 20]),
      ...p.polygon([[17, 33], [26, 40], [17, 47]], false),
      p.line([31, 48], [43, 48]),
    ],
    filled: [p.ring([13, 14], 1.6), p.ring([19, 14], 1.6), p.ring([25, 14], 1.6)],
  })),

  // Registration crosses, the drafting table's punctuation.
  ...[1, 2, 3].map((i) =>
    doodle(`mark-${i}`, [20, 20], 200 + i, (p) => ({
      solid: [p.line([10, 3], [10, 17]), p.line([3, 10], [17, 10])],
    })),
  ),
];

function Drawing({ name, size: [w, h], sketch }: Doodle) {
  return (
    <svg className={`doodle doodle--${name}`} viewBox={`0 0 ${w} ${h}`} focusable="false">
      <path d={sketch.solid.join('')} />
      {sketch.faint && <path className="doodle__faint" d={sketch.faint.join('')} />}
      {sketch.dashed && <path className="doodle__dashed" d={sketch.dashed.join('')} />}
      {sketch.filled && <path className="doodle__filled" d={sketch.filled.join('')} />}
    </svg>
  );
}

export default function Doodles() {
  return (
    <div className="doodles" aria-hidden="true">
      {DOODLES.map((d) => (
        <Drawing key={d.name} {...d} />
      ))}
    </div>
  );
}
