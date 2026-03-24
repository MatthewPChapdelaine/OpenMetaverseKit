export const worldPresets = {
  sunset: {
    label: "Sunset Commons",
    background: 0x0f172a,
    fog: 0x1e293b,
    floor: 0x1d4ed8,
    accent: 0xf97316,
    portal: 0xfbbf24,
    skyTop: "#f97316",
    skyBottom: "#312e81"
  },
  neon: {
    label: "Neon District",
    background: 0x020617,
    fog: 0x111827,
    floor: 0x0f172a,
    accent: 0x22d3ee,
    portal: 0xe879f9,
    skyTop: "#0f172a",
    skyBottom: "#1d4ed8"
  },
  forest: {
    label: "Forest Mesh",
    background: 0x04120c,
    fog: 0x0f2d1f,
    floor: 0x14532d,
    accent: 0x84cc16,
    portal: 0x34d399,
    skyTop: "#166534",
    skyBottom: "#052e16"
  }
};

export const defaultWorldConfig = {
  worldName: "Commons Plaza",
  theme: "sunset",
  portalCount: 4,
  districtCount: 3,
  hubCount: 5,
  experienceScale: 2.5
};
