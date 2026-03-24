import "./style.css";

import * as THREE from "three";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "three/examples/jsm/webxr/XRHandModelFactory.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

import { createMetaverse } from "./metaverseGenerator";
import { defaultWorldConfig, worldPresets } from "./worldPresets";

const storageKey = "open-metaverse-kit.world";

const viewport = document.querySelector("#viewport");
const form = document.querySelector("#world-form");
const manifestOutput = document.querySelector("#manifest-output");
const sceneTitle = document.querySelector("#scene-title");
const assetFileInput = document.querySelector("#asset-file");
const importStatus = document.querySelector("#import-status");
const importedAssetList = document.querySelector("#imported-asset-list");
const enableControlsButton = document.querySelector("#enable-controls-button");
const resetViewButton = document.querySelector("#reset-view-button");
const controlsStatus = document.querySelector("#controls-status");
const playerNameInput = document.querySelector("#player-name");
const roomIdInput = document.querySelector("#room-id");
const serverUrlInput = document.querySelector("#server-url");
const participantList = document.querySelector("#participant-list");
const chatLog = document.querySelector("#chat-log");
const chatInput = document.querySelector("#chat-input");
const emoteStatus = document.querySelector("#emote-status");
const sitButton = document.querySelector("#sit-button");
const standButton = document.querySelector("#stand-button");
const seatStatus = document.querySelector("#seat-status");
const xrStatus = document.querySelector("#xr-status");
const multiplayerStatus = document.querySelector("#multiplayer-status");
const runtimeStatusPill = document.querySelector("#runtime-status-pill");

const stats = {
  entities: document.querySelector("#stat-entities"),
  portals: document.querySelector("#stat-portals"),
  districts: document.querySelector("#stat-districts"),
  theme: document.querySelector("#stat-theme"),
  importedAssets: document.querySelector("#stat-imported-assets"),
  participants: document.querySelector("#stat-participants")
};

const gltfLoader = new GLTFLoader();
const clock = new THREE.Clock();
const xrControllerModelFactory = new XRControllerModelFactory();
const xrHandModelFactory = new XRHandModelFactory();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 250);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.shadowMap.enabled = true;
renderer.xr.enabled = true;
viewport.append(renderer.domElement);
viewport.append(VRButton.createButton(renderer));

scene.add(new THREE.HemisphereLight(0xffffff, 0x0f172a, 1.35));

const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
sunLight.position.set(12, 20, 8);
sunLight.castShadow = true;
scene.add(sunLight);

let activeWorld = null;
const importedAssetGroup = new THREE.Group();
importedAssetGroup.name = "ImportedAssets";
scene.add(importedAssetGroup);
const remoteAvatarGroup = new THREE.Group();
remoteAvatarGroup.name = "RemoteParticipants";
scene.add(remoteAvatarGroup);

const importedAssets = [];
const remoteAvatars = new Map();
const movementKeys = new Set();

const multiplayer = {
  socket: null,
  playerId: null,
  roomId: "commons",
  players: new Map(),
  chatMessages: [],
  syncIntervalId: null,
  activeEmote: null
};

const desktopControls = {
  yaw: Math.PI,
  pitch: -0.08,
  pointerLocked: false,
  eyeHeight: 1.6,
  jumpOffset: 0,
  verticalVelocity: 0,
  seated: false,
  activeSeatId: null
};

const emoteMap = {
  Digit1: "wave",
  Digit2: "dance",
  Digit3: "clap",
  Digit4: "cheer"
};

const xrState = {
  active: false,
  controllers: []
};

hydrateForm(loadStoredConfig());
hydrateMultiplayerForm();
setupXRControllers();
renderImportedAssetList();
renderParticipants();
renderChatLog();
resetDesktopView();
renderFromForm();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderFromForm();
});

document.querySelector("#randomize-button").addEventListener("click", () => {
  const themes = Object.keys(worldPresets);
  document.querySelector("#world-theme").value = themes[Math.floor(Math.random() * themes.length)];
  document.querySelector("#portal-count").value = String(randomInt(2, 10));
  document.querySelector("#district-count").value = String(randomInt(1, 8));
  document.querySelector("#hub-count").value = String(randomInt(1, 12));
  document.querySelector("#experience-scale").value = String(randomChoice([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]));
  document.querySelector("#world-name").value = randomChoice([
    "Commons Mesh",
    "Open Harbor",
    "Signal Garden",
    "Portal Yard",
    "Makers' Quadrant"
  ]);
  renderFromForm();
});

document.querySelector("#export-button").addEventListener("click", () => {
  const config = getFormConfig();
  manifestOutput.value = JSON.stringify(config, null, 2);
  navigator.clipboard?.writeText(manifestOutput.value).catch(() => {});
});

document.querySelector("#import-button").addEventListener("click", () => {
  try {
    const imported = JSON.parse(manifestOutput.value);
    hydrateForm({
      ...defaultWorldConfig,
      ...imported
    });
    renderFromForm();
  } catch {
    manifestOutput.value = "Invalid JSON manifest. Fix the document and try import again.";
  }
});

document.querySelector("#load-asset-button").addEventListener("click", () => {
  assetFileInput.click();
});

assetFileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  await importBlenderAsset(file);
  assetFileInput.value = "";
});

document.querySelector("#clear-assets-button").addEventListener("click", () => {
  clearImportedAssets();
});

enableControlsButton.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

resetViewButton.addEventListener("click", () => {
  resetDesktopView();
  setControlsStatus("View reset. Click the viewport or press Enable Controls to resume mouse look.");
});

document.querySelector("#connect-button").addEventListener("click", () => {
  connectMultiplayer();
});

document.querySelector("#disconnect-button").addEventListener("click", () => {
  disconnectMultiplayer("Disconnected from the room.");
});

document.querySelector("#send-chat-button").addEventListener("click", () => {
  sendChatMessage();
});

document.querySelectorAll(".emote-button").forEach((button) => {
  button.addEventListener("click", () => {
    triggerEmote(button.dataset.emote);
  });
});

sitButton.addEventListener("click", () => {
  sitAtNearestSeat();
});

standButton.addEventListener("click", () => {
  standUp();
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendChatMessage();
  }
});

window.addEventListener("resize", onResize);
renderer.domElement.addEventListener("click", () => {
  if (!desktopControls.pointerLocked) {
    renderer.domElement.requestPointerLock();
  }
});
document.addEventListener("pointerlockchange", handlePointerLockChange);
window.addEventListener("mousemove", handleMouseLook);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
onResize();

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05);
  updateDesktopControls(delta);
  updateXRPresentationState();

  if (activeWorld?.group) {
    activeWorld.group.rotation.y += 0.0015;
  }

  renderer.render(scene, camera);
});

function renderFromForm() {
  const config = getFormConfig();
  saveConfig(config);

  if (activeWorld?.group) {
    scene.remove(activeWorld.group);
  }

  activeWorld = createMetaverse(scene, config);
  scene.add(activeWorld.group);
  relayoutImportedAssets(config);

  sceneTitle.textContent = config.worldName;
  stats.entities.textContent = String(activeWorld.stats.entities + importedAssets.length + remoteAvatars.size);
  stats.portals.textContent = String(activeWorld.stats.portals);
  stats.districts.textContent = String(activeWorld.stats.districts);
  stats.theme.textContent = activeWorld.stats.themeLabel;
  stats.importedAssets.textContent = String(importedAssets.length);
  stats.participants.textContent = String(Math.max(multiplayer.players.size, 1));
  manifestOutput.value = JSON.stringify(config, null, 2);
}

function getFormConfig() {
  return {
    worldName: document.querySelector("#world-name").value.trim() || defaultWorldConfig.worldName,
    theme: document.querySelector("#world-theme").value,
    portalCount: Number.parseInt(document.querySelector("#portal-count").value, 10),
    districtCount: Number.parseInt(document.querySelector("#district-count").value, 10),
    hubCount: Number.parseInt(document.querySelector("#hub-count").value, 10),
    experienceScale: Number.parseFloat(document.querySelector("#experience-scale").value)
  };
}

function hydrateForm(config) {
  document.querySelector("#world-name").value = config.worldName;
  document.querySelector("#world-theme").value = config.theme;
  document.querySelector("#portal-count").value = String(config.portalCount);
  document.querySelector("#district-count").value = String(config.districtCount);
  document.querySelector("#hub-count").value = String(config.hubCount);
  document.querySelector("#experience-scale").value = String(config.experienceScale);
}

function loadStoredConfig() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? { ...defaultWorldConfig, ...JSON.parse(raw) } : defaultWorldConfig;
  } catch {
    return defaultWorldConfig;
  }
}

function saveConfig(config) {
  window.localStorage.setItem(storageKey, JSON.stringify(config));
}

function onResize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}

function setupXRControllers() {
  for (let index = 0; index < 2; index += 1) {
    const controller = renderer.xr.getController(index);
    controller.userData.index = index;
    controller.userData.handedness = index === 0 ? "left" : "right";
    controller.addEventListener("connected", (event) => {
      controller.userData.handedness = event.data.handedness || controller.userData.handedness;
      controller.visible = true;
      setXrStatus(`XR ${controller.userData.handedness} controller connected. Trigger waves; grip toggles sit/stand.`);
    });
    controller.addEventListener("disconnected", () => {
      controller.visible = false;
      setXrStatus("A controller disconnected. Remaining XR mappings stay active if another input source is present.");
    });
    controller.addEventListener("selectstart", () => {
      triggerEmote("wave");
      pulseController(controller);
    });
    controller.addEventListener("squeezestart", () => {
      if (desktopControls.seated) {
        standUp();
      } else {
        sitAtNearestSeat();
      }
      pulseController(controller);
    });

    const ray = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -3.2)
      ]),
      new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.75 })
    );
    ray.name = "ray";
    controller.add(ray);
    scene.add(controller);

    const grip = renderer.xr.getControllerGrip(index);
    grip.add(xrControllerModelFactory.createControllerModel(grip));
    scene.add(grip);

    const hand = renderer.xr.getHand(index);
    hand.add(xrHandModelFactory.createHandModel(hand, "mesh"));
    scene.add(hand);

    xrState.controllers.push({ controller, grip, hand, ray });
  }

  renderer.xr.addEventListener("sessionstart", () => {
    xrState.active = true;
    setXrStatus("Immersive mode active. Trigger to wave, grip to sit/stand, and use controller rays for pointing.");
  });

  renderer.xr.addEventListener("sessionend", () => {
    xrState.active = false;
    setXrStatus("Desktop mode active. Enter VR to enable controller and hand mappings.");
  });
}

function updateXRPresentationState() {
  const presenting = renderer.xr.isPresenting;
  if (presenting !== xrState.active) {
    xrState.active = presenting;
    setXrStatus(
      presenting
        ? "Immersive mode active. Trigger to wave, grip to sit/stand, and use controller rays for pointing."
        : "Desktop mode active. Enter VR to enable controller and hand mappings."
    );
  }

  xrState.controllers.forEach(({ controller, ray }) => {
    ray.visible = presenting;
    controller.visible = presenting;
  });
}

async function importBlenderAsset(file) {
  setImportStatus(`Importing ${file.name}...`);

  const objectUrl = URL.createObjectURL(file);
  try {
    const gltf = await gltfLoader.loadAsync(objectUrl);
    const model = gltf.scene;
    const normalizedModel = normalizeImportedModel(model);

    importedAssetGroup.add(normalizedModel);
    importedAssets.push({
      name: file.name,
      object: normalizedModel,
      sourceType: file.name.toLowerCase().endsWith(".glb") ? "GLB" : "GLTF"
    });

    relayoutImportedAssets(getFormConfig());
    renderImportedAssetList();
    updateEntityCounts();
    stats.importedAssets.textContent = String(importedAssets.length);
    setImportStatus(`Imported ${file.name} into the current world.`);
  } catch (error) {
    console.error(error);
    setImportStatus(`Could not import ${file.name}. Export from Blender as .glb for the most reliable one-file transfer.`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function normalizeImportedModel(model) {
  const group = new THREE.Group();
  group.add(model);

  const bounds = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bounds.getSize(size);
  bounds.getCenter(center);

  const largestAxis = Math.max(size.x, size.y, size.z, 0.001);
  const scale = 3 / largestAxis;
  group.scale.setScalar(scale);
  group.position.sub(center.multiplyScalar(scale));

  group.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  return group;
}

function relayoutImportedAssets(config) {
  const radius = 5 + config.experienceScale * 4.2;
  const count = Math.max(importedAssets.length, 1);

  importedAssets.forEach((asset, index) => {
    const angle = (index / count) * Math.PI * 2 + 0.35;
    asset.object.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    asset.object.rotation.y = -angle + Math.PI / 2;
  });
}

function renderImportedAssetList() {
  importedAssetList.innerHTML = "";

  if (importedAssets.length === 0) {
    importedAssetList.innerHTML = "<div class=\"asset-item\"><strong>No imported assets</strong><span>Load a Blender export to place it in the scene.</span></div>";
    return;
  }

  importedAssets.forEach((asset, index) => {
    const item = document.createElement("article");
    item.className = "asset-item";
    item.innerHTML = `<strong>${escapeHtml(asset.name)}</strong><span>${asset.sourceType} asset · slot ${index + 1}</span>`;
    importedAssetList.append(item);
  });
}

function clearImportedAssets() {
  importedAssets.splice(0, importedAssets.length);
  importedAssetGroup.clear();
  renderImportedAssetList();
  updateEntityCounts();
  stats.importedAssets.textContent = "0";
  setImportStatus("Imported Blender assets cleared from the current world.");
}

function setImportStatus(message) {
  importStatus.textContent = message;
}

function hydrateMultiplayerForm() {
  const playerName = window.localStorage.getItem("open-metaverse-kit.playerName") ?? "Builder One";
  const roomId = window.localStorage.getItem("open-metaverse-kit.roomId") ?? "commons";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.hostname || "localhost";
  const serverUrl = window.localStorage.getItem("open-metaverse-kit.serverUrl") ?? `${protocol}//${host}:8787`;

  playerNameInput.value = playerName;
  roomIdInput.value = roomId;
  serverUrlInput.value = serverUrl;
}

function connectMultiplayer() {
  if (multiplayer.socket && multiplayer.socket.readyState <= WebSocket.OPEN) {
    return;
  }

  const serverUrl = serverUrlInput.value.trim();
  const playerName = playerNameInput.value.trim() || "Guest";
  const roomId = roomIdInput.value.trim().toLowerCase() || "commons";

  window.localStorage.setItem("open-metaverse-kit.playerName", playerName);
  window.localStorage.setItem("open-metaverse-kit.roomId", roomId);
  window.localStorage.setItem("open-metaverse-kit.serverUrl", serverUrl);

  setMultiplayerStatus(`Connecting to ${serverUrl}...`, false);

  const socket = new WebSocket(serverUrl);
  multiplayer.socket = socket;
  multiplayer.roomId = roomId;

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({
      type: "join",
      roomId,
      playerName
    }));
    startStateSync();
  });

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    handleMultiplayerMessage(payload);
  });

  socket.addEventListener("close", () => {
    stopStateSync();
    multiplayer.socket = null;
    multiplayer.playerId = null;
    multiplayer.players.clear();
    multiplayer.chatMessages = [];
    removeAllRemoteAvatars();
    renderParticipants();
    renderChatLog();
    stats.participants.textContent = "1";
    updateEntityCounts();
    setMultiplayerStatus("Offline. Start the multiplayer server and connect to a room.", false);
  });

  socket.addEventListener("error", () => {
    setMultiplayerStatus("Could not reach the multiplayer server. Start `npm run multiplayer` and reconnect.", false);
  });
}

function disconnectMultiplayer(message) {
  if (multiplayer.socket) {
    multiplayer.socket.close();
  }
  setMultiplayerStatus(message, false);
}

function handleMultiplayerMessage(payload) {
  if (payload.type === "welcome") {
    multiplayer.playerId = payload.playerId;
    return;
  }

  if (payload.type === "room-state") {
    multiplayer.players = new Map(payload.players.map((player) => [player.playerId, player]));
    multiplayer.chatMessages = Array.isArray(payload.messages) ? payload.messages : [];
    syncRemoteAvatars();
    renderParticipants();
    renderChatLog();
    stats.participants.textContent = String(Math.max(multiplayer.players.size, 1));
    setMultiplayerStatus(`Connected to room ${payload.roomId}.`, true);
    updateEntityCounts();
    return;
  }

  if (payload.type === "player-state") {
    multiplayer.players.set(payload.player.playerId, payload.player);
    syncRemoteAvatars();
    renderParticipants();
    stats.participants.textContent = String(Math.max(multiplayer.players.size, 1));
    updateEntityCounts();
    return;
  }

  if (payload.type === "player-left") {
    multiplayer.players.delete(payload.playerId);
    removeRemoteAvatar(payload.playerId);
    renderParticipants();
    stats.participants.textContent = String(Math.max(multiplayer.players.size, 1));
    updateEntityCounts();
    return;
  }

  if (payload.type === "player-emote") {
    const player = multiplayer.players.get(payload.playerId);
    if (player) {
      player.emote = payload.emote;
      player.emoteUntil = payload.emoteUntil;
    }
    syncRemoteAvatars();
    renderParticipants();
    multiplayer.chatMessages.push({
      id: `emote-${Date.now()}`,
      playerName: payload.playerName,
      text: `triggered ${payload.emote}`,
      timestamp: new Date().toISOString()
    });
    multiplayer.chatMessages = multiplayer.chatMessages.slice(-40);
    renderChatLog();
    return;
  }

  if (payload.type === "chat-message") {
    multiplayer.chatMessages.push(payload.message);
    multiplayer.chatMessages = multiplayer.chatMessages.slice(-40);
    renderChatLog();
    return;
  }

  if (payload.type === "system-message") {
    multiplayer.chatMessages.push({
      id: `system-${Date.now()}`,
      playerName: "System",
      text: payload.message,
      timestamp: new Date().toISOString()
    });
    multiplayer.chatMessages = multiplayer.chatMessages.slice(-40);
    renderChatLog();
  }
}

function startStateSync() {
  stopStateSync();
  multiplayer.syncIntervalId = window.setInterval(() => {
    if (!multiplayer.socket || multiplayer.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    multiplayer.socket.send(JSON.stringify({
      type: "player-state",
      state: {
        position: {
          x: camera.position.x,
          y: 1.6,
          z: camera.position.z
        },
        rotationY: camera.rotation.y,
        emote: multiplayer.activeEmote?.name ?? null,
        emoteUntil: multiplayer.activeEmote?.until ?? null,
        seated: desktopControls.seated,
        seatId: desktopControls.activeSeatId
      }
    }));
  }, 150);
}

function stopStateSync() {
  if (multiplayer.syncIntervalId) {
    window.clearInterval(multiplayer.syncIntervalId);
    multiplayer.syncIntervalId = null;
  }
}

function syncRemoteAvatars() {
  const seen = new Set();

  for (const [playerId, player] of multiplayer.players.entries()) {
    if (playerId === multiplayer.playerId) {
      continue;
    }

    seen.add(playerId);
    let avatar = remoteAvatars.get(playerId);
    if (!avatar) {
      avatar = createRemoteAvatar(player);
      remoteAvatars.set(playerId, avatar);
      remoteAvatarGroup.add(avatar);
    }

    avatar.position.set(player.position.x, 0, player.position.z);
    avatar.rotation.y = player.rotationY ?? 0;
    animateAvatarEmote(avatar, player.emote, player.emoteUntil);
  }

  for (const playerId of Array.from(remoteAvatars.keys())) {
    if (!seen.has(playerId)) {
      removeRemoteAvatar(playerId);
    }
  }
}

function createRemoteAvatar(player) {
  const tone = colorFromId(player.playerId);
  const avatar = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.9, 4, 12),
    new THREE.MeshStandardMaterial({
      color: tone,
      emissive: tone,
      emissiveIntensity: 0.18
    })
  );
  body.position.y = 1;
  avatar.add(body);

  const beacon = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.06, 12, 24),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: tone,
      emissiveIntensity: 0.45
    })
  );
  beacon.rotation.x = Math.PI / 2;
  beacon.position.y = 2.15;
  avatar.add(beacon);
  avatar.userData.body = body;
  avatar.userData.beacon = beacon;

  return avatar;
}

function removeRemoteAvatar(playerId) {
  const avatar = remoteAvatars.get(playerId);
  if (!avatar) {
    return;
  }

  remoteAvatarGroup.remove(avatar);
  remoteAvatars.delete(playerId);
}

function removeAllRemoteAvatars() {
  for (const playerId of Array.from(remoteAvatars.keys())) {
    removeRemoteAvatar(playerId);
  }
}

function renderParticipants() {
  participantList.innerHTML = "";

  const players = Array.from(multiplayer.players.values());
  if (players.length === 0) {
    participantList.innerHTML = "<div class=\"roster-item\"><strong>Solo mode</strong><span>Connect to a room to see other participants.</span></div>";
    return;
  }

  players
    .sort((left, right) => left.playerName.localeCompare(right.playerName))
    .forEach((player) => {
      const item = document.createElement("article");
      item.className = "roster-item";
      const localTag = player.playerId === multiplayer.playerId ? " (You)" : "";
      const emoteLabel = player.emote ? ` · ${player.emote}` : "";
      const postureLabel = player.seated ? " · seated" : "";
      item.innerHTML = `<strong>${escapeHtml(player.playerName)}${localTag}</strong><span>${escapeHtml(multiplayer.roomId)} · x ${player.position.x.toFixed(1)} · z ${player.position.z.toFixed(1)}${escapeHtml(emoteLabel + postureLabel)}</span>`;
      participantList.append(item);
    });
}

function renderChatLog() {
  chatLog.innerHTML = "";

  if (multiplayer.chatMessages.length === 0) {
    chatLog.innerHTML = "<div class=\"chat-item\"><strong>No messages yet</strong><span>Chat will appear here after people join and talk.</span></div>";
    return;
  }

  multiplayer.chatMessages.slice(-18).forEach((message) => {
    const item = document.createElement("article");
    item.className = "chat-item";
    item.innerHTML = `<strong>${escapeHtml(message.playerName ?? "System")}</strong><span>${escapeHtml(message.text ?? "")}</span>`;
    chatLog.append(item);
  });

  chatLog.scrollTop = chatLog.scrollHeight;
}

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text || !multiplayer.socket || multiplayer.socket.readyState !== WebSocket.OPEN) {
    return;
  }

  multiplayer.socket.send(JSON.stringify({
    type: "chat-message",
    text
  }));
  chatInput.value = "";
}

function setMultiplayerStatus(message, online) {
  multiplayerStatus.textContent = message;
  runtimeStatusPill.textContent = online ? "Social room online" : "Desktop + VR ready";
  runtimeStatusPill.classList.toggle("status-pill--online", online);
  runtimeStatusPill.classList.toggle("status-pill--offline", !online);
}

function updateEntityCounts() {
  stats.entities.textContent = String((activeWorld?.stats.entities ?? 0) + importedAssets.length + remoteAvatars.size);
}

function resetDesktopView() {
  desktopControls.yaw = Math.PI;
  desktopControls.pitch = -0.08;
  desktopControls.eyeHeight = 1.6;
  desktopControls.jumpOffset = 0;
  desktopControls.verticalVelocity = 0;
  camera.position.set(0, desktopControls.eyeHeight, 18);
  applyCameraRotation();
}

function handlePointerLockChange() {
  desktopControls.pointerLocked = document.pointerLockElement === renderer.domElement;
  if (desktopControls.pointerLocked) {
    setControlsStatus("Social controls active. Use WASD to move, Shift to sprint, Space to jump, and Esc to release.");
  } else {
    movementKeys.clear();
    setControlsStatus("Cursor released. Click the viewport or press Enable Controls to re-enter movement mode.");
  }
}

function handleMouseLook(event) {
  if (!desktopControls.pointerLocked) {
    return;
  }

  const sensitivity = 0.0022;
  desktopControls.yaw -= event.movementX * sensitivity;
  desktopControls.pitch -= event.movementY * sensitivity;
  desktopControls.pitch = THREE.MathUtils.clamp(desktopControls.pitch, -1.25, 1.25);
  applyCameraRotation();
}

function handleKeyDown(event) {
  if (isTypingInField()) {
    return;
  }

  if (emoteMap[event.code]) {
    triggerEmote(emoteMap[event.code]);
    return;
  }

  if (event.code === "KeyE") {
    event.preventDefault();
    if (desktopControls.seated) {
      standUp();
    } else {
      sitAtNearestSeat();
    }
    return;
  }

  movementKeys.add(event.code);

  if (event.code === "Space") {
    event.preventDefault();
    if (desktopControls.jumpOffset === 0) {
      desktopControls.verticalVelocity = 5.6;
    }
  }
}

function handleKeyUp(event) {
  movementKeys.delete(event.code);
}

function updateDesktopControls(delta) {
  if (desktopControls.seated) {
    camera.position.y = desktopControls.eyeHeight;
    return;
  }

  const forward = Number(movementKeys.has("KeyW")) - Number(movementKeys.has("KeyS"));
  const strafe = Number(movementKeys.has("KeyD")) - Number(movementKeys.has("KeyA"));
  const isMoving = forward !== 0 || strafe !== 0;

  if (isMoving) {
    const direction = new THREE.Vector3(strafe, 0, -forward).normalize();
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), desktopControls.yaw);

    const baseSpeed = movementKeys.has("ShiftLeft") || movementKeys.has("ShiftRight") ? 8.8 : 5.2;
    camera.position.addScaledVector(direction, baseSpeed * delta);
  }

  const targetEyeHeight = movementKeys.has("KeyC") ? 1.1 : 1.6;
  desktopControls.eyeHeight = THREE.MathUtils.lerp(desktopControls.eyeHeight, targetEyeHeight, Math.min(1, delta * 12));

  if (desktopControls.jumpOffset > 0 || desktopControls.verticalVelocity > 0) {
    desktopControls.jumpOffset += desktopControls.verticalVelocity * delta;
    desktopControls.verticalVelocity -= 18 * delta;

    if (desktopControls.jumpOffset <= 0) {
      desktopControls.jumpOffset = 0;
      desktopControls.verticalVelocity = 0;
    }
  }

  camera.position.y = desktopControls.eyeHeight + desktopControls.jumpOffset;
}

function triggerEmote(emoteName) {
  const until = Date.now() + 2800;
  multiplayer.activeEmote = {
    name: emoteName,
    until
  };
  setEmoteStatus(`Active emote: ${emoteName}`);

  if (multiplayer.socket && multiplayer.socket.readyState === WebSocket.OPEN) {
    multiplayer.socket.send(JSON.stringify({
      type: "player-emote",
      emote: emoteName,
      emoteUntil: until,
      playerName: playerNameInput.value.trim() || "Guest"
    }));
  }

  window.setTimeout(() => {
    if (multiplayer.activeEmote?.until === until) {
      multiplayer.activeEmote = null;
      setEmoteStatus("No emote active. Use `1` through `4` for quick gestures.");
    }
  }, 2900);
}

function animateAvatarEmote(avatar, emote, emoteUntil) {
  const body = avatar.userData.body;
  const beacon = avatar.userData.beacon;
  if (!body || !beacon) {
    return;
  }

  avatar.position.y = 0;
  body.rotation.z = 0;
  body.scale.set(1, 1, 1);
  beacon.scale.set(1, 1, 1);
  beacon.position.y = 2.15;

  const stillActive = emote && emoteUntil && emoteUntil > Date.now();
  if (!stillActive) {
    return;
  }

  const pulse = Math.sin(Date.now() * 0.015);
  if (emote === "wave") {
    body.rotation.z = pulse * 0.18;
  } else if (emote === "dance") {
    avatar.position.y = Math.max(0, pulse * 0.18);
  } else if (emote === "clap") {
    body.scale.set(1 + pulse * 0.05, 1, 1 + pulse * 0.05);
  } else if (emote === "cheer") {
    beacon.scale.setScalar(1.15 + pulse * 0.12);
    beacon.position.y = 2.2 + Math.abs(pulse) * 0.22;
  }
}

function sitAtNearestSeat() {
  const nearestSeat = findNearestSeat();
  if (!nearestSeat) {
    setSeatStatus("No seat nearby. Move closer to a social pod and try again.");
    return;
  }

  desktopControls.seated = true;
  desktopControls.activeSeatId = nearestSeat.id;
  desktopControls.jumpOffset = 0;
  desktopControls.verticalVelocity = 0;
  desktopControls.eyeHeight = 1.15;
  camera.position.set(nearestSeat.position.x, desktopControls.eyeHeight, nearestSeat.position.z);
  desktopControls.yaw = nearestSeat.facing;
  applyCameraRotation();
  setSeatStatus(`Seated at ${nearestSeat.label}. Press E or Stand to get back up.`);
}

function standUp() {
  if (!desktopControls.seated) {
    setSeatStatus("Already standing.");
    return;
  }

  desktopControls.seated = false;
  desktopControls.activeSeatId = null;
  desktopControls.eyeHeight = 1.6;
  camera.position.y = desktopControls.eyeHeight;
  setSeatStatus("Standing. Move near a social pod and press E or use Sit to take a seat.");
}

function findNearestSeat() {
  const sitPoints = activeWorld?.sitPoints ?? [];
  let nearest = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const sitPoint of sitPoints) {
    const distance = sitPoint.position.distanceTo(new THREE.Vector3(camera.position.x, 0, camera.position.z));
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = sitPoint;
    }
  }

  return nearestDistance <= 4.5 ? nearest : null;
}

function applyCameraRotation() {
  camera.rotation.y = desktopControls.yaw;
  camera.rotation.x = desktopControls.pitch;
}

function setControlsStatus(message) {
  controlsStatus.textContent = message;
}

function setEmoteStatus(message) {
  emoteStatus.textContent = message;
}

function setSeatStatus(message) {
  seatStatus.textContent = message;
}

function setXrStatus(message) {
  xrStatus.textContent = message;
}

function pulseController(controller) {
  const session = renderer.xr.getSession();
  if (!session) {
    return;
  }

  const inputSource = session.inputSources.find((source) => source.handedness === controller.userData.handedness);
  const actuator = inputSource?.gamepad?.hapticActuators?.[0];
  actuator?.pulse?.(0.35, 70).catch?.(() => {});
}

function isTypingInField() {
  const activeElement = document.activeElement;
  if (!activeElement) {
    return false;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function escapeHtml(value) {
  return value
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function colorFromId(value) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return new THREE.Color(`hsl(${hash % 360} 75% 58%)`);
}
