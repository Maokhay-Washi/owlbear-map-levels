import OBR from "@owlbear-rodeo/sdk";

const EXT_ID = "com.maor.map-levels";
const SCENE_KEY = `${EXT_ID}/scene`;
const ITEM_KEY = `${EXT_ID}/item`;

const app = document.querySelector("#app");

app.innerHTML = `
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, system-ui, sans-serif;
    }
    body {
      margin: 0;
      background: #121212;
      color: #f4f4f5;
    }
    #app {
      padding: 12px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 18px;
    }
    p {
      margin: 0 0 10px;
      font-size: 12px;
      line-height: 1.4;
      color: #c7c7cc;
    }
    .card {
      border: 1px solid #2d2d32;
      border-radius: 12px;
      padding: 10px;
      background: #18181b;
      margin-bottom: 10px;
    }
    .row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    input, select, button {
      font: inherit;
      border-radius: 10px;
      border: 1px solid #35353b;
      padding: 8px 10px;
      background: #232329;
      color: #f4f4f5;
    }
    input, select {
      flex: 1;
      min-width: 0;
    }
    button {
      cursor: pointer;
    }
    button:hover {
      background: #2c2c33;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .level {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
      border: 1px solid #2d2d32;
      border-radius: 12px;
      padding: 10px;
      margin-bottom: 8px;
      background: #16161a;
    }
    .level-name {
      font-size: 14px;
      font-weight: 600;
    }
    .muted {
      font-size: 12px;
      color: #b0b0b8;
    }
    .btns {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .status {
      min-height: 18px;
      font-size: 12px;
      color: #a1a1aa;
      margin-top: 4px;
    }
  </style>

  <h1>Map Levels</h1>
  <p>
    Create floors, assign selected scene items to a floor, and show one floor at a time.
    Best result: put each floor map image and its related tokens/props on the same level.
  </p>

  <div class="card">
    <div class="row">
      <input id="levelName" type="text" placeholder="New level name" />
      <button id="createLevel">Create</button>
    </div>
    <div class="row">
      <select id="levelSelect"></select>
      <button id="assignSelected">Assign selected</button>
    </div>
    <div class="row">
      <button id="showAll">Show all</button>
      <button id="refresh">Refresh</button>
    </div>
    <div class="status" id="status"></div>
  </div>

  <div id="levels"></div>
`;

const levelNameInput = document.getElementById("levelName");
const createLevelBtn = document.getElementById("createLevel");
const levelSelect = document.getElementById("levelSelect");
const assignSelectedBtn = document.getElementById("assignSelected");
const showAllBtn = document.getElementById("showAll");
const refreshBtn = document.getElementById("refresh");
const levelsDiv = document.getElementById("levels");
const statusDiv = document.getElementById("status");

function setStatus(message) {
  statusDiv.textContent = message;
}

function makeId() {
  return crypto.randomUUID();
}

function defaultState() {
  return { levels: [], activeLevelId: null };
}

async function getSceneState() {
  const metadata = await OBR.scene.getMetadata();
  return metadata[SCENE_KEY] || defaultState();
}

async function setSceneState(state) {
  await OBR.scene.setMetadata({ [SCENE_KEY]: state });
}

async function getAssignedCount(levelId) {
  const items = await OBR.scene.items.getItems(
    (item) => item.metadata?.[ITEM_KEY]?.levelId === levelId
  );
  return items.length;
}

async function refreshUI() {
  const ready = await OBR.scene.isReady();
  if (!ready) {
    levelsDiv.innerHTML = `<div class="card"><div class="muted">Open a scene to use Map Levels.</div></div>`;
    levelSelect.innerHTML = "";
    createLevelBtn.disabled = true;
    assignSelectedBtn.disabled = true;
    showAllBtn.disabled = true;
    refreshBtn.disabled = true;
    return;
  }

  createLevelBtn.disabled = false;
  assignSelectedBtn.disabled = false;
  showAllBtn.disabled = false;
  refreshBtn.disabled = false;

  const state = await getSceneState();
  levelSelect.innerHTML = "";
  levelsDiv.innerHTML = "";

  if (state.levels.length === 0) {
    levelSelect.innerHTML = `<option value="">No levels yet</option>`;
    levelsDiv.innerHTML = `<div class="card"><div class="muted">Create your first level, then assign selected items to it.</div></div>`;
    return;
  }

  for (const level of state.levels) {
    const option = document.createElement("option");
    option.value = level.id;
    option.textContent = level.name;
    if (level.id === state.activeLevelId) option.selected = true;
    levelSelect.appendChild(option);
  }

  for (const level of state.levels) {
    const assignedCount = await getAssignedCount(level.id);
    const levelEl = document.createElement("div");
    levelEl.className = "level";
    levelEl.innerHTML = `
      <div>
        <div class="level-name">${escapeHtml(level.name)}</div>
        <div class="muted">${level.id === state.activeLevelId ? "Active level" : "Inactive"} · ${assignedCount} assigned item${assignedCount === 1 ? "" : "s"}</div>
      </div>
      <div class="btns">
        <button data-action="activate" data-id="${level.id}">Show</button>
        <button data-action="rename" data-id="${level.id}">Rename</button>
        <button data-action="delete" data-id="${level.id}">Delete</button>
      </div>
    `;
    levelsDiv.appendChild(levelEl);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function createLevel() {
  const name = levelNameInput.value.trim();
  if (!name) {
    setStatus("Enter a level name first.");
    return;
  }

  const state = await getSceneState();
  const level = { id: makeId(), name };
  state.levels.push(level);
  if (!state.activeLevelId) state.activeLevelId = level.id;
  await setSceneState(state);
  levelNameInput.value = "";
  setStatus(`Created level: ${name}`);
  await refreshUI();
}

async function assignSelectedToLevel() {
  const levelId = levelSelect.value;
  if (!levelId) {
    setStatus("Create a level first.");
    return;
  }

  const selectedIds = await OBR.player.getSelection();
  if (!selectedIds || selectedIds.length === 0) {
    setStatus("Select one or more scene items first.");
    return;
  }

  await OBR.scene.items.updateItems(selectedIds, (items) => {
    for (const item of items) {
      item.metadata[ITEM_KEY] = { levelId };
    }
  });

  setStatus(`Assigned ${selectedIds.length} selected item${selectedIds.length === 1 ? "" : "s"}.`);
  await refreshUI();
}

async function activateLevel(levelId) {
  const state = await getSceneState();
  state.activeLevelId = levelId;
  await setSceneState(state);

  await OBR.scene.items.updateItems(
    (item) => item.metadata?.[ITEM_KEY]?.levelId !== undefined,
    (items) => {
      for (const item of items) {
        item.visible = item.metadata?.[ITEM_KEY]?.levelId === levelId;
      }
    }
  );

  const level = state.levels.find((entry) => entry.id === levelId);
  setStatus(`Showing level: ${level?.name || "Unknown"}`);
  await refreshUI();
}

async function showAllLevels() {
  await OBR.scene.items.updateItems(
    (item) => item.metadata?.[ITEM_KEY]?.levelId !== undefined,
    (items) => {
      for (const item of items) {
        item.visible = true;
      }
    }
  );

  const state = await getSceneState();
  state.activeLevelId = null;
  await setSceneState(state);
  setStatus("All assigned levels are visible.");
  await refreshUI();
}

async function renameLevel(levelId) {
  const state = await getSceneState();
  const level = state.levels.find((entry) => entry.id === levelId);
  if (!level) return;

  const nextName = window.prompt("Rename level", level.name)?.trim();
  if (!nextName) return;

  level.name = nextName;
  await setSceneState(state);
  setStatus(`Renamed level to ${nextName}.`);
  await refreshUI();
}

async function deleteLevel(levelId) {
  const state = await getSceneState();
  const level = state.levels.find((entry) => entry.id === levelId);
  if (!level) return;

  const confirmed = window.confirm(`Delete level \"${level.name}\"? Assigned items will stay in the scene and be unassigned.`);
  if (!confirmed) return;

  await OBR.scene.items.updateItems(
    (item) => item.metadata?.[ITEM_KEY]?.levelId === levelId,
    (items) => {
      for (const item of items) {
        delete item.metadata[ITEM_KEY];
        item.visible = true;
      }
    }
  );

  state.levels = state.levels.filter((entry) => entry.id !== levelId);
  if (state.activeLevelId === levelId) {
    state.activeLevelId = state.levels[0]?.id ?? null;
  }
  await setSceneState(state);

  if (state.activeLevelId) {
    await activateLevel(state.activeLevelId);
  } else {
    setStatus(`Deleted level: ${level.name}`);
    await refreshUI();
  }
}

levelsDiv.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  const levelId = button.dataset.id;
  if (!action || !levelId) return;

  if (action === "activate") await activateLevel(levelId);
  if (action === "rename") await renameLevel(levelId);
  if (action === "delete") await deleteLevel(levelId);
});

createLevelBtn.addEventListener("click", createLevel);
assignSelectedBtn.addEventListener("click", assignSelectedToLevel);
showAllBtn.addEventListener("click", showAllLevels);
refreshBtn.addEventListener("click", refreshUI);
levelNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") createLevel();
});

async function init() {
  await OBR.onReady();
  OBR.scene.onReadyChange(() => {
    refreshUI().catch(console.error);
  });
  OBR.scene.onMetadataChange(() => {
    refreshUI().catch(console.error);
  });
  OBR.scene.items.onChange(() => {
    refreshUI().catch(console.error);
  });
  await refreshUI();
}

init().catch((error) => {
  console.error(error);
  setStatus("Failed to initialize extension.");
});
