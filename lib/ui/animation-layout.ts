export function seededValue(index: number, salt: number): number {
  // Keep this entirely in 32-bit integer space. Transcendental functions such
  // as Math.sin can differ by a few ULPs between V8 and JavaScriptCore, which
  // is enough to make React see a different inline style during hydration.
  let value = Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

function rounded(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

export function createParticleLayout(count = 14) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: rounded(4 + seededValue(index, 1) * 92),
    delay: rounded(-(seededValue(index, 2) * 4.2)),
    duration: rounded(3.2 + seededValue(index, 3) * 2.1),
    size: rounded(12 + seededValue(index, 4) * 13),
    drift: rounded(-28 + seededValue(index, 5) * 56),
  }));
}

export function createCloudLayout(count = 3) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    delay: rounded(-(4 + seededValue(index, 11) * 18)),
    duration: rounded(27 + seededValue(index, 12) * 17),
    opacity: rounded(0.72 + seededValue(index, 13) * 0.22),
  }));
}

export function createCropLayout(count = 18) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    delay: rounded(-(seededValue(index, 21) * 1.5)),
    height: rounded(43 + seededValue(index, 22) * 18),
  }));
}

export function createRainLayout(count = 30) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: rounded(seededValue(index, 31) * 100),
    delay: rounded(-(seededValue(index, 32) * 1.1)),
    duration: rounded(0.46 + seededValue(index, 33) * 0.34),
    opacity: rounded(0.34 + seededValue(index, 34) * 0.54),
    length: rounded(32 + seededValue(index, 35) * 30),
  }));
}

export function createAnimalLayout() {
  return {
    chicken: { delay: rounded(-(seededValue(0, 41) * 17)), duration: rounded(15 + seededValue(0, 42) * 4) },
    sheep: { delay: rounded(-(seededValue(1, 41) * 24)), duration: rounded(21 + seededValue(1, 42) * 6) },
    crow: { delay: rounded(-(seededValue(2, 41) * 15)), duration: rounded(13 + seededValue(2, 42) * 5) },
  } as const;
}

export const FARM_ANIMATION_LAYOUT = Object.freeze({
  clouds: Object.freeze(createCloudLayout()),
  crops: Object.freeze(createCropLayout()),
  particles: Object.freeze(createParticleLayout()),
  rain: Object.freeze(createRainLayout()),
  animals: Object.freeze(createAnimalLayout()),
});
