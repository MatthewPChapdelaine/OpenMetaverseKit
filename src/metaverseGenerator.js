import * as THREE from "three";

import { worldPresets } from "./worldPresets";

export function createMetaverse(scene, config) {
  const preset = worldPresets[config.theme] ?? worldPresets.sunset;
  const world = new THREE.Group();
  const sitPoints = [];

  scene.background = new THREE.Color(preset.background);
  scene.fog = new THREE.FogExp2(preset.fog, 0.022);

  const floorRadius = 16 + config.experienceScale * 10;
  const floorGeometry = new THREE.CircleGeometry(floorRadius, 64);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: preset.floor,
    roughness: 0.78,
    metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);

  world.add(createCentralHub(config, preset));
  world.add(createDistrictRing(config, preset));
  world.add(createPortalRing(config, preset));
  world.add(createSocialHubs(config, preset, sitPoints));
  world.add(createFloatingNodes(config, preset));

  return {
    group: world,
    stats: {
      entities: world.children.length,
      portals: config.portalCount,
      districts: config.districtCount,
      themeLabel: preset.label
    },
    sitPoints
  };
}

function createCentralHub(config, preset) {
  const hub = new THREE.Group();

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(5 + config.experienceScale, 5 + config.experienceScale, 1.6, 40),
    new THREE.MeshStandardMaterial({
      color: preset.accent,
      emissive: preset.accent,
      emissiveIntensity: 0.12,
      roughness: 0.48
    })
  );
  platform.position.y = 0.8;
  hub.add(platform);

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 1.1, 7 + config.experienceScale * 2, 24),
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: preset.portal,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.72
    })
  );
  beacon.position.y = 4.5 + config.experienceScale;
  hub.add(beacon);

  return hub;
}

function createDistrictRing(config, preset) {
  const ring = new THREE.Group();
  const radius = 10 + config.experienceScale * 4;

  for (let index = 0; index < config.districtCount; index += 1) {
    const angle = (index / config.districtCount) * Math.PI * 2;
    const district = new THREE.Group();

    const block = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3 + index, 4),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        emissive: preset.accent,
        emissiveIntensity: 0.1
      })
    );
    block.position.y = 1.5 + index * 0.5;
    district.add(block);

    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: preset.portal })
    );
    cap.position.y = 4.1 + index * 0.5;
    district.add(cap);

    district.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    district.lookAt(0, 1.5, 0);
    ring.add(district);
  }

  return ring;
}

function createPortalRing(config, preset) {
  const ring = new THREE.Group();
  const radius = 7 + config.experienceScale * 5;

  for (let index = 0; index < config.portalCount; index += 1) {
    const angle = (index / config.portalCount) * Math.PI * 2;
    const portal = new THREE.Group();

    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.22, 18, 40),
      new THREE.MeshStandardMaterial({
        color: preset.portal,
        emissive: preset.portal,
        emissiveIntensity: 0.95
      })
    );
    arch.rotation.y = Math.PI / 2;
    arch.position.y = 2.2;
    portal.add(arch);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.2, 24),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
    );
    pad.position.y = 0.1;
    portal.add(pad);

    portal.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    portal.lookAt(0, 1.6, 0);
    ring.add(portal);
  }

  return ring;
}

function createSocialHubs(config, preset, sitPoints) {
  const hubs = new THREE.Group();
  const radius = 4 + config.experienceScale * 4.5;

  for (let index = 0; index < config.hubCount; index += 1) {
    const angle = (index / config.hubCount) * Math.PI * 2 + 0.42;
    const pod = new THREE.Group();

    const seat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.95, 0.8, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: preset.accent, emissiveIntensity: 0.18 })
    );
    seat.position.y = 0.4;
    pod.add(seat);

    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: preset.accent,
        transparent: true,
        opacity: 0.35
      })
    );
    canopy.position.y = 1.2;
    pod.add(canopy);

    pod.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    sitPoints.push({
      id: `hub-seat-${index + 1}`,
      label: `Social pod ${index + 1}`,
      position: new THREE.Vector3(pod.position.x, 0, pod.position.z),
      facing: Math.atan2(-pod.position.x, -pod.position.z)
    });
    hubs.add(pod);
  }

  return hubs;
}

function createFloatingNodes(config, preset) {
  const nodes = new THREE.Group();
  const count = 18 + config.portalCount + config.hubCount;

  for (let index = 0; index < count; index += 1) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.14 + (index % 3) * 0.05, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: preset.portal,
        emissiveIntensity: 0.45
      })
    );

    const angle = (index / count) * Math.PI * 2;
    const radius = 7 + (index % 5) * 2 + config.experienceScale;
    orb.position.set(Math.cos(angle) * radius, 3 + (index % 4), Math.sin(angle) * radius);
    nodes.add(orb);
  }

  return nodes;
}
