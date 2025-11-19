import { YOUTUBER_POOL, RATES, BUFF, ENEMY_BASE, GACHA_COST, PITY, ENEMY_THEMES, CRIT } from "./constants.js";
import { colorForRarity, emojiForRarity, pickRarity, pickByRarity } from "./utils.js";

// Module-scoped team state
let team = [];
let nextId = 1;

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  preload() {}

  create() {
    this.add.rectangle(360, 240, 720, 480, 0x08121b);

    // Enemy
    this.enemyContainer = this.add.container(360, 120);
    this.enemySprite = this.add
      .rectangle(0, 0, 140, 140, 0xffe500)
      .setStrokeStyle(4, 0x222200);
    this.enemyLabel = this.add
      .text(0, 0, "Dollar Kuning\nHP: 0", {
        color: "#071018",
        fontSize: 14,
        align: "center",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.enemyContainer.add([this.enemySprite, this.enemyLabel]);

    // Team display
    this.teamDisplay = this.add.container(360, 360);

    // Tips
    this.tips = this.add.text(
      12,
      12,
      "Tip: Gacha -> Build team -> Battle\nDupe = level up (merge)",
      { color: "#cfeaff", fontSize: 14 }
    );

    this.setupHtmlHooks();
    this.initState();
    this.renderTeamSprites();
    this.setEnemy();
    this.createSfxIcon();
  }

  setupHtmlHooks() {
    this.gachaBtn = document.getElementById("gachaBtn");
    this.battleBtn = document.getElementById("battleBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.pullCount = document.getElementById("pullCount");
    this.lastPull = document.getElementById("lastPull");
    this.teamListEl = document.getElementById("teamList");
    this.battleLogEl = document.getElementById("battleLog");
    this.crystalsEl = document.getElementById("crystals");
    this.ratesInfoEl = document.getElementById("ratesInfo");
    this.pityInfoEl = document.getElementById("pityInfo");
    this.stageLabelEl = document.getElementById("stageLabel");
    this.clearSaveBtn = document.getElementById("clearSaveBtn");
    this.toggleSfxBtn = document.getElementById("toggleSfxBtn");
    this.toggleStreamerBtn = document.getElementById("toggleStreamerBtn");
    // Developer panel hooks
    this.devPanel = document.getElementById("devPanel");
    this.devC100 = document.getElementById("devC100");
    this.devC1000 = document.getElementById("devC1000");
    this.devHealTeamBtn = document.getElementById("devHealTeam");
    this.devAddCommon = document.getElementById("devAddCommon");
    this.devAddRare = document.getElementById("devAddRare");
    this.devAddEpic = document.getElementById("devAddEpic");
    this.devAddLegend = document.getElementById("devAddLegend");
    this.devNameInput = document.getElementById("devNameInput");
    this.devAddByName = document.getElementById("devAddByName");
    this.devStageInput = document.getElementById("devStageInput");
    this.devSetStage = document.getElementById("devSetStage");
    this.devEnemyHpInput = document.getElementById("devEnemyHpInput");
    this.devSetEnemyHp = document.getElementById("devSetEnemyHp");
    this.devForceWin = document.getElementById("devForceWin");
    this.devToggleStream = document.getElementById("devToggleStream");
    // Victory recap elements
    this.victoryModal = document.getElementById("victoryModal");
    this.victoryCard = document.getElementById("victoryCard");
    this.victoryTextEl = document.getElementById("victoryText");
    this.victoryNextBtn = document.getElementById("victoryNextBtn");
    // Settings controls
    this.rateCommonEl = document.getElementById("rateCommon");
    this.rateRareEl = document.getElementById("rateRare");
    this.rateEpicEl = document.getElementById("rateEpic");
    this.rateLegendEl = document.getElementById("rateLegend");
    this.pityEpicInput = document.getElementById("pityEpicInput");
    this.pityLegendInput = document.getElementById("pityLegendInput");
    this.saveSettingsBtn = document.getElementById("saveSettingsBtn");
    this.defaultSettingsBtn = document.getElementById("defaultSettingsBtn");

    const getCrystals = () => Number(this.crystalsEl?.innerText || 0) || 0;
    const setCrystals = (val) => {
      if (this.crystalsEl) this.crystalsEl.innerText = String(val);
    };
    this.getCrystals = getCrystals;
    this.setCrystals = setCrystals;
    const canAfford = (count) => getCrystals() >= (count === 10 ? GACHA_COST[10] : GACHA_COST[1]);
    const spend = (count) => {
      const cost = count === 10 ? GACHA_COST[10] : GACHA_COST[1];
      setCrystals(Math.max(0, getCrystals() - cost));
      return cost;
    };
    const updateGachaBtnState = () => {
      const count = Number(this.pullCount.value);
      const affordable = canAfford(count);
      const shouldDisable = this.gachaLocked ? true : !affordable;
      this.gachaBtn.disabled = shouldDisable;
      this.gachaBtn.setAttribute("aria-pressed", String(affordable));
    };
    this.updateGachaBtnState = updateGachaBtnState;

    const updateRatesInfo = () => {
      if (!this.ratesInfoEl) return;
      // Display rates in % with one decimal
      const asPct = (v) => (Math.round(v * 1000) / 10).toFixed(1) + "%";
      this.ratesInfoEl.innerText = `Rates — Common ${asPct(RATES.common)} • Rare ${asPct(RATES.rare)} • Epic ${asPct(RATES.epic)} • Legend ${asPct(RATES.legend)}`;
    };
    updateRatesInfo();

    this.wave = 1; // default wave; may be overridden by load
    this.pityEpic = 0;
    this.pityLegend = 0;
    this.rates = { ...RATES };
    this.pityConfig = { epic: PITY.epic, legend: PITY.legend };
    this.crit = { chance: CRIT.chance, mult: CRIT.mult };
    this.sfxMuted = false;
    this.streamerMode = false;
    this.victoryShown = false;
    this.devMode = false;
    const updateStageLabel = () => {
      if (this.stageLabelEl) this.stageLabelEl.textContent = `Stage ${this.wave}`;
    };
    this.updateStageLabel = updateStageLabel;
    updateStageLabel();

    // Streamer Mode UI helpers
    const setStreamerBtnLabel = () => {
      if (!this.toggleStreamerBtn) return;
      this.toggleStreamerBtn.textContent = this.streamerMode ? "🎥 Stream On" : "🎥 Stream Off";
    };
    this.setStreamerBtnLabel = setStreamerBtnLabel;
    const applyStreamerMode = () => {
      const on = !!this.streamerMode;
      const settingsPanel = document.getElementById("settingsPanel");
      const battleLogPanel = this.battleLogEl?.closest?.(".panel-block");
      if (settingsPanel) settingsPanel.style.display = on ? "none" : "";
      if (battleLogPanel) battleLogPanel.style.display = on ? "none" : "";
      if (this.ratesInfoEl) this.ratesInfoEl.style.display = on ? "none" : "";
      if (this.pityInfoEl) this.pityInfoEl.style.display = on ? "none" : "";
      setStreamerBtnLabel();
    };
    this.applyStreamerMode = applyStreamerMode;

    this.gachaBtn.onclick = () => {
      const count = Number(this.pullCount.value);
      if (this.gachaLocked) return;
      if (!canAfford(count)) {
        this.log("💸 Crystals tidak cukup untuk gacha ini.");
        return;
      }
      const spent = spend(count);
      const results = [];
      for (let i = 0; i < count; i++) {
        results.push(this.performGacha());
      }
      const last = results[results.length - 1];
      this.lastPull.innerText = `Last: ${emojiForRarity(last.rarity)} ${last.name} (Lv ${last.level}) — Spent ${spent}`;
      this.log(
        `🎰 Gacha: ${results
          .map((r) => `${emojiForRarity(r.rarity)} ${r.name} (Lv ${r.level})`)
          .join(", ")} • Cost ${spent}`
      );
      this.renderTeamSprites();
      this.flashGacha();
      updateGachaBtnState();
      this.saveState();
    };

    this.battleBtn.onclick = async () => {
      this.battleBtn.disabled = true;
      await this.runBattle();
      this.battleBtn.disabled = false;
    };

    this.resetBtn.onclick = () => {
      team = [];
      nextId = 1;
      this.renderTeamSprites();
      this.log("♻️ Team reset.");
      updateGachaBtnState();
      this.saveState();
    };

    this.pullCount.onchange = updateGachaBtnState;
    // Manage gacha availability during battle
    this.gachaLocked = false;
    this.setGachaLock = (locked) => {
      this.gachaLocked = !!locked;
      if (this.pullCount) this.pullCount.disabled = !!locked;
      this.updateGachaBtnState();
      if (this.gachaBtn) this.gachaBtn.setAttribute("aria-busy", String(!!locked));
    };
    updateGachaBtnState();

    const updatePityInfo = () => {
      if (!this.pityInfoEl) return;
      const epicP = `${this.pityEpic}/${this.pityConfig.epic}`;
      const legP = `${this.pityLegend}/${this.pityConfig.legend}`;
      this.pityInfoEl.innerText = `Pity — Epic ${epicP} • Legend ${legP}`;
    };
    this.updatePityInfo = updatePityInfo;
    updatePityInfo();

    this.clearSaveBtn?.addEventListener("click", () => {
      try { localStorage.removeItem("cc_state_v1"); } catch {}
      // reset runtime state
      team = [];
      nextId = 1;
      this.wave = 1;
      this.pityEpic = 0;
      this.pityLegend = 0;
      this.setCrystals(900);
      this.updateStageLabel();
      this.updateGachaBtnState();
      this.updatePityInfo();
      this.renderTeamSprites();
      this.setEnemy();
      this.log("🧹 Save cleared. State reset to defaults.");
      this.saveState();
    });
    // Seed settings inputs
    const fillSettingsInputs = () => {
      if (!this.rateCommonEl) return;
      this.rateCommonEl.value = String(this.rates.common);
      this.rateRareEl.value = String(this.rates.rare);
      this.rateEpicEl.value = String(this.rates.epic);
      this.rateLegendEl.value = String(this.rates.legend);
      this.pityEpicInput.value = String(this.pityConfig.epic);
      this.pityLegendInput.value = String(this.pityConfig.legend);
    };
    this.fillSettingsInputs = fillSettingsInputs;
    fillSettingsInputs();

    const readAndApplySettings = (useDefaults = false) => {
      if (useDefaults) {
        this.rates = { ...RATES };
        this.pityConfig = { epic: PITY.epic, legend: PITY.legend };
      } else {
        const c = parseFloat(this.rateCommonEl.value);
        const r = parseFloat(this.rateRareEl.value);
        const e = parseFloat(this.rateEpicEl.value);
        const l = parseFloat(this.rateLegendEl.value);
        let sum = (c || 0) + (r || 0) + (e || 0) + (l || 0);
        if (sum <= 0) { // fallback to defaults
          this.rates = { ...RATES };
        } else {
          // normalize to sum = 1
          this.rates = {
            common: (c || 0) / sum,
            rare: (r || 0) / sum,
            epic: (e || 0) / sum,
            legend: (l || 0) / sum,
          };
        }
        const pEpic = parseInt(this.pityEpicInput.value, 10) || PITY.epic;
        const pLeg = parseInt(this.pityLegendInput.value, 10) || PITY.legend;
        this.pityConfig = { epic: Math.max(1, pEpic), legend: Math.max(1, pLeg) };
      }
      this.updateRatesInfo();
      this.updatePityInfo();
      this.fillSettingsInputs();
      this.saveState();
      this.log("⚙️ Settings updated.");
    };
    this.readAndApplySettings = readAndApplySettings;

    this.saveSettingsBtn?.addEventListener("click", () => readAndApplySettings(false));
    this.defaultSettingsBtn?.addEventListener("click", () => readAndApplySettings(true));

    const setSfxBtnLabel = () => {
      if (!this.toggleSfxBtn) return;
      this.toggleSfxBtn.textContent = this.sfxMuted ? "🔇 Sound Off" : "🔊 Sound On";
    };
    this.setSfxBtnLabel = setSfxBtnLabel;
    setSfxBtnLabel();
    this.toggleSfxBtn?.addEventListener("click", () => {
      this.sfxMuted = !this.sfxMuted;
      setSfxBtnLabel();
      this.updateSfxIcon?.();
      this.saveState();
    });

    // Streamer mode toggle (button + hotkey S)
    this.toggleStreamerBtn?.addEventListener("click", () => {
      this.streamerMode = !this.streamerMode;
      this.applyStreamerMode();
      this.saveState();
      if (!this.sfxMuted) this.beep(600, 70, 'sine', 0.04);
    });
    this._streamerKeyHandler = (e) => {
      if (e.repeat) return;
      if (e.key && e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.streamerMode = !this.streamerMode;
        this.applyStreamerMode();
        this.saveState();
        if (!this.sfxMuted) this.beep(600, 70, 'sine', 0.04);
      }
    };
    window.addEventListener('keydown', this._streamerKeyHandler);

    // Victory recap wiring
    const showVictory = (reward, clearedStage, nextStage) => {
      this.victoryShown = true;
      if (this.victoryTextEl) {
        this.victoryTextEl.textContent = `Stage ${clearedStage} cleared • Reward +${reward} Crystals`;
      }
      if (this.victoryModal) {
        this.victoryModal.style.display = 'flex';
        this.victoryModal.setAttribute('aria-hidden', 'false');
        if (this.victoryCard) {
          this.victoryCard.style.opacity = '0';
          this.victoryCard.style.transform = 'scale(0.96)';
          requestAnimationFrame(() => {
            this.victoryCard.style.opacity = '1';
            this.victoryCard.style.transform = 'scale(1)';
          });
        }
      }
      if (this.battleBtn) this.battleBtn.disabled = true;
      this.setGachaLock?.(true);
      if (!this.sfxMuted) this.beep(740, 90, 'sine', 0.05);
    };
    const hideVictory = () => {
      if (this.victoryModal) {
        if (this.victoryCard) {
          this.victoryCard.style.opacity = '0';
          this.victoryCard.style.transform = 'scale(0.96)';
          setTimeout(() => {
            this.victoryModal.style.display = 'none';
            this.victoryModal.setAttribute('aria-hidden', 'true');
          }, 200);
        } else {
          this.victoryModal.style.display = 'none';
          this.victoryModal.setAttribute('aria-hidden', 'true');
        }
      }
      this.victoryShown = false;
      if (this.battleBtn) this.battleBtn.disabled = false;
      this.setGachaLock?.(false);
      this.updateGachaBtnState?.();
      this.showNextStageHint?.(this.wave);
    };
    this.showVictory = showVictory;
    this.hideVictory = hideVictory;
    this.victoryNextBtn?.addEventListener('click', () => hideVictory());
    this._victoryKeyHandler = (e) => {
      if (this.victoryModal && this.victoryModal.style.display !== 'none') {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault(); hideVictory();
        }
      }
    };
    window.addEventListener('keydown', this._victoryKeyHandler);

    // In-canvas next stage hint
    this.showNextStageHint = (stage) => {
      const x = this.game.config.width / 2;
      const y = 40;
      const text = this.add.text(x, y, `Next: Stage ${stage}`, { color: '#e6f4ff', fontSize: 16, fontStyle: 'bold' }).setOrigin(0.5).setDepth(300);
      const bg = this.add.rectangle(x, y + 2, text.width + 20, 28, 0x000000, 0.35).setDepth(299);
      bg.setStrokeStyle(1, 0xffffff, 0.18);
      this.tweens.add({ targets: [text, bg], y: '-=10', duration: 500, ease: 'Cubic.easeOut' });
      this.tweens.add({ targets: [text, bg], alpha: { from: 1, to: 0 }, delay: 900, duration: 500, onComplete: () => { text.destroy(); bg.destroy(); } });
      if (!this.sfxMuted) this.beep(700, 60, 'triangle', 0.035);
    };

    // Developer Panel logic
    const applyDevMode = () => {
      const on = !!this.devMode;
      if (this.devPanel) this.devPanel.style.display = on ? "block" : "none";
      try { localStorage.setItem('cc_dev_mode', JSON.stringify(on)); } catch {}
    };
    this.applyDevMode = applyDevMode;
    try {
      const rawDev = localStorage.getItem('cc_dev_mode');
      if (rawDev) this.devMode = JSON.parse(rawDev) === true;
    } catch {}
    applyDevMode();
    this._devKeyHandler = (e) => {
      if (e.ctrlKey && e.altKey && (e.key?.toLowerCase?.() === 'd')) {
        e.preventDefault();
        this.devMode = !this.devMode;
        applyDevMode();
        if (!this.sfxMuted) this.beep(this.devMode ? 760 : 420, 80, 'sine', 0.04);
      }
    };
    window.addEventListener('keydown', this._devKeyHandler);
    const guardBattle = () => {
      if (this.gachaLocked) { this.log('⛔ In battle — action blocked.'); return true; }
      return false;
    };
    const addCrystals = (amt) => {
      if (guardBattle()) return;
      const before = this.getCrystals();
      this.setCrystals(before + amt);
      this.updateGachaBtnState?.();
      this.saveState();
      this.log(`🧪 Dev: +${amt} Crystals (now ${before + amt})`);
    };
    const addByRarity = (rarity) => {
      if (guardBattle()) return;
      const sample = pickByRarity(YOUTUBER_POOL, rarity);
      const existing = team.find((c) => c.name === sample.name);
      if (existing) {
        existing.level += 1;
        existing.atk += BUFF.atkPerLevel;
        existing.hp += BUFF.hpPerLevel;
        existing.maxHp = (existing.maxHp || existing.hp);
        existing.maxHp += BUFF.hpPerLevel;
        this.log(`🧪 Dev: Dupe ${existing.name} -> Lv ${existing.level}`);
      } else {
        const inst = { id: nextId++, name: sample.name, atk: sample.atk, hp: sample.hp, maxHp: sample.hp, level: 1, rarity: sample.rarity };
        team.push(inst);
        this.log(`🧪 Dev: Add ${inst.name} (${inst.rarity})`);
      }
      this.renderTeamSprites();
      this.saveState();
    };
    const addByName = (name) => {
      if (guardBattle()) return;
      const sample = YOUTUBER_POOL.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (!sample) { this.log(`⚠️ Dev: Name not found: ${name}`); return; }
      const existing = team.find((c) => c.name === sample.name);
      if (existing) {
        existing.level += 1; existing.atk += BUFF.atkPerLevel; existing.hp += BUFF.hpPerLevel; existing.maxHp = (existing.maxHp || existing.hp) + BUFF.hpPerLevel;
        this.log(`🧪 Dev: Dupe ${existing.name} -> Lv ${existing.level}`);
      } else {
        const inst = { id: nextId++, name: sample.name, atk: sample.atk, hp: sample.hp, maxHp: sample.hp, level: 1, rarity: sample.rarity };
        team.push(inst);
        this.log(`🧪 Dev: Add ${inst.name}`);
      }
      this.renderTeamSprites(); this.saveState();
    };
    const setStage = (n) => {
      if (guardBattle()) return;
      const s = Math.max(1, parseInt(n, 10) || 1);
      this.wave = s; this.updateStageLabel(); this.setEnemy(); this.saveState();
      this.log(`🧪 Dev: Stage -> ${this.wave}`);
    };
    const setEnemyHp = (hp) => {
      if (guardBattle()) return;
      const v = Math.max(0, parseInt(hp, 10) || 0);
      if (!this.enemy) this.setEnemy();
      this.enemy.hp = v; this.updateEnemyUI(); this.log(`🧪 Dev: Enemy HP -> ${v}`);
    };
    const forceWin = () => {
      if (guardBattle()) return;
      const reward = 120 + (this.wave * 60);
      const before = this.getCrystals(); this.setCrystals(before + reward);
      this.wave += 1; this.updateStageLabel();
      this.updateGachaBtnState?.(); this.saveState();
      for (let i = 0; i < 30; i++) {
        const ang = Phaser.Math.Between(0, 360); const dist = Phaser.Math.Between(10, 160);
        const x = 360 + Math.cos(Phaser.Math.DegToRad(ang)) * dist;
        const y = 120 + Math.sin(Phaser.Math.DegToRad(ang)) * dist;
        this.spawnParticles(x, y, 1, { life: 700, size: 5, speed: 220 });
      }
      this.showVictory?.(reward, this.wave - 1, this.wave);
      this.log(`🧪 Dev: Forced Victory • +${reward} Crystals • Next Stage ${this.wave}`);
    };
    const fullHeal = () => {
      if (guardBattle()) return;
      team.forEach((m) => { if (typeof m.maxHp === 'number') m.hp = m.maxHp; });
      this.renderTeamSprites(); this.log('🧪 Dev: Full heal team');
    };
    this.devC100?.addEventListener('click', () => addCrystals(100));
    this.devC1000?.addEventListener('click', () => addCrystals(1000));
    this.devHealTeamBtn?.addEventListener('click', () => fullHeal());
    this.devAddCommon?.addEventListener('click', () => addByRarity('common'));
    this.devAddRare?.addEventListener('click', () => addByRarity('rare'));
    this.devAddEpic?.addEventListener('click', () => addByRarity('epic'));
    this.devAddLegend?.addEventListener('click', () => addByRarity('legend'));
    this.devAddByName?.addEventListener('click', () => {
      const name = (this.devNameInput?.value || '').trim(); if (name) addByName(name);
    });
    this.devSetStage?.addEventListener('click', () => setStage(this.devStageInput?.value));
    this.devSetEnemyHp?.addEventListener('click', () => setEnemyHp(this.devEnemyHpInput?.value));
    this.devForceWin?.addEventListener('click', () => forceWin());
    this.devToggleStream?.addEventListener('click', () => { this.streamerMode = !this.streamerMode; this.applyStreamerMode?.(); this.setStreamerBtnLabel?.(); this.saveState(); });
  }

  initState() {
    try {
      const raw = localStorage.getItem("cc_state_v1");
      if (!raw) return;
      const state = JSON.parse(raw);
      if (Array.isArray(state.team)) {
        // restore team and nextId
        // eslint-disable-next-line no-undef
        team = state.team.map((m) => ({ ...m }));
        nextId = typeof state.nextId === "number" ? state.nextId : (team.reduce((mx, m) => Math.max(mx, m.id || 0), 0) + 1);
      }
      if (typeof state.crystals === "number") {
        this.setCrystals(state.crystals);
      }
      if (typeof state.wave === "number" && state.wave >= 1) {
        this.wave = state.wave;
      }
      if (typeof state.pityEpic === "number") this.pityEpic = state.pityEpic;
      if (typeof state.pityLegend === "number") this.pityLegend = state.pityLegend;
      if (state.rates && typeof state.rates === "object") {
        this.rates = { ...this.rates, ...state.rates };
      }
      if (state.pityConfig && typeof state.pityConfig === "object") {
        this.pityConfig = { ...this.pityConfig, ...state.pityConfig };
      }
      if (state.crit && typeof state.crit === "object") {
        this.crit = { ...this.crit, ...state.crit };
      }
      if (typeof state.sfxMuted === "boolean") this.sfxMuted = state.sfxMuted;
      if (typeof state.streamerMode === "boolean") this.streamerMode = state.streamerMode;
      this.updateStageLabel?.();
      this.updateGachaBtnState?.();
      this.updatePityInfo?.();
      this.updateRatesInfo?.();
      this.fillSettingsInputs?.();
      this.setSfxBtnLabel?.();
      this.updateSfxIcon?.();
      this.setStreamerBtnLabel?.();
      this.applyStreamerMode?.();
    } catch (e) {
      console.warn("Failed to load state:", e);
    }
  }

  saveState() {
    try {
      const state = {
        team,
        nextId,
        crystals: this.getCrystals?.() ?? 0,
        wave: this.wave ?? 1,
        pityEpic: this.pityEpic ?? 0,
        pityLegend: this.pityLegend ?? 0,
        rates: this.rates,
        pityConfig: this.pityConfig,
        crit: this.crit,
        sfxMuted: this.sfxMuted,
        streamerMode: this.streamerMode,
      };
      localStorage.setItem("cc_state_v1", JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
  }

  setEnemy() {
    const theme = ENEMY_THEMES[(this.wave - 1) % ENEMY_THEMES.length] || ENEMY_THEMES[0];
    const teamScale = Math.max(1, 1 + team.length * 0.15);
    const stageScale = 1 + (this.wave - 1) * 0.2;
    const baseHp = theme.hp * stageScale;
    const baseAtk = theme.atk * (1 + (this.wave - 1) * 0.08);
    this.enemy = {
      name: theme.name,
      hp: Math.round(baseHp * teamScale),
      atk: Math.round(baseAtk * teamScale),
      color: theme.color,
    };
    // update enemy visuals and battle button label
    this.enemySprite.setFillStyle(this.enemy.color || 0xffe500, 1);
    if (this.battleBtn) this.battleBtn.textContent = `⚔️ Battle vs ${this.enemy.name}`;
    this.updateEnemyUI();
  }

  updateEnemyUI() {
    this.enemyLabel.setText(`${this.enemy.name}\nHP: ${this.enemy.hp}`);
    const size = Phaser.Math.Clamp(
      140 + (this.enemy.hp - ENEMY_BASE.hp) * 0.8,
      80,
      220
    );
    this.enemySprite.width = size;
    this.enemySprite.height = size;
  }

  performGacha() {
    // pity check: legend first, then epic
    let rarity;
    if (this.pityLegend + 1 >= this.pityConfig.legend) {
      rarity = "legend";
    } else if (this.pityEpic + 1 >= this.pityConfig.epic) {
      rarity = "epic";
    } else {
      rarity = pickRarity(this.rates);
    }
    const charSample = pickByRarity(YOUTUBER_POOL, rarity);
    const existing = team.find((c) => c.name === charSample.name);
    if (existing) {
      existing.level += 1;
      existing.atk += BUFF.atkPerLevel;
      existing.hp += BUFF.hpPerLevel;
      if (typeof existing.maxHp === "number") {
        existing.maxHp += BUFF.hpPerLevel;
      } else {
        existing.maxHp = existing.hp;
      }
      this.log(
        `🔥 Dupe! ${existing.name} naik ke Lv ${existing.level} (ATK ${existing.atk}, HP ${existing.hp})`
      );
      // update pity counters
      if (rarity === "legend") {
        this.pityLegend = 0; this.pityEpic = 0;
      } else if (rarity === "epic") {
        this.pityEpic = 0; this.pityLegend += 1;
      } else {
        this.pityEpic += 1; this.pityLegend += 1;
      }
      this.updatePityInfo?.();
      this.saveState();
      return existing;
    } else {
      const inst = {
        id: nextId++,
        name: charSample.name,
        atk: charSample.atk,
        hp: charSample.hp,
        maxHp: charSample.hp,
        level: 1,
        rarity: charSample.rarity,
      };
      team.push(inst);
      this.log(`✨ Dapet ${emojiForRarity(inst.rarity)} ${inst.name} (Lv 1)`);
      // update pity counters
      if (rarity === "legend") {
        this.pityLegend = 0; this.pityEpic = 0;
      } else if (rarity === "epic") {
        this.pityEpic = 0; this.pityLegend += 1;
      } else {
        this.pityEpic += 1; this.pityLegend += 1;
      }
      this.updatePityInfo?.();
      this.saveState();
      return inst;
    }
  }

  renderTeamSprites() {
    this.teamDisplay.removeAll(true);
    const spacing = 140;
    const startX = -((team.length - 1) * spacing) / 2;
    team.forEach((member, idx) => {
      const x = startX + idx * spacing;
      const color = colorForRarity(member.rarity);
      const card = this.add.container(x, 0);
      const rect = this.add
        .rectangle(0, 0, 120, 120, color)
        .setStrokeStyle(3, 0x000000);
      const name = this.add
        .text(0, -36, `${member.name}` , {
          fontSize: 14,
          color: "#041018",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      const lvl = this.add
        .text(0, -14, `Lv ${member.level}`, { fontSize: 12, color: "#041018" })
        .setOrigin(0.5);
      const stat = this.add
        .text(0, 6, `HP ${member.hp}\nATK ${member.atk}`, {
          fontSize: 12,
          color: "#041018",
          align: "center",
        })
        .setOrigin(0.5);
      card.add([rect, name, lvl, stat]);
      card.setSize(120, 120);

      card.setInteractive(
        new Phaser.Geom.Rectangle(-60, -60, 120, 120),
        Phaser.Geom.Rectangle.Contains
      );
      card.on("pointerover", () =>
        this.tweens.add({ targets: card, scale: 1.06, duration: 120 })
      );
      card.on("pointerout", () =>
        this.tweens.add({ targets: card, scale: 1.0, duration: 120 })
      );

      this.teamDisplay.add(card);
    });

    this.renderHtmlTeamList();
  }

  renderHtmlTeamList() {
    this.teamListEl.innerHTML = "";
    if (team.length === 0) {
      this.teamListEl.innerHTML = `<div class="placeholder">No members yet — gacha dulu!</div>`;
      return;
    }
    team.forEach((m) => {
      const div = document.createElement("div");
      div.className = "team-item";
      div.innerHTML = `
        <div>
          <div class="team-name">${emojiForRarity(m.rarity)} ${m.name}</div>
          <div class="team-meta">Lv ${m.level} • HP ${m.hp} • ATK ${m.atk}</div>
        </div>
        <div style="text-align:right">
          <button class="btn-secondary" data-id="${m.id}" style="font-size:12px;padding:6px 8px">⚡+</button>
        </div>
      `;
      this.teamListEl.appendChild(div);

      div.querySelector("button")?.addEventListener("click", () => {
        m.level++;
        m.atk += BUFF.atkPerLevel;
        m.hp += BUFF.hpPerLevel;
        if (typeof m.maxHp === "number") {
          m.maxHp += BUFF.hpPerLevel;
        } else {
          m.maxHp = m.hp;
        }
        this.log(`⚙️ Upgrade manual ${m.name} -> Lv ${m.level}`);
        this.renderTeamSprites();
      });
    });
  }

  flashGacha() {
    const flash = this.add
      .rectangle(360, 240, 720, 480, 0xffffff)
      .setAlpha(0.0)
      .setDepth(50);
    this.tweens.add({
      targets: flash,
      alpha: { from: 0.9, to: 0 },
      duration: 220,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });

    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(240, 480);
      const y = Phaser.Math.Between(30, 90);
      this.spawnParticles(x, y, 1, { life: 600, size: 4, speed: 30 });
    }
  }

  async runBattle() {
    if (team.length === 0) {
      this.log("⚠️ Tim kosong — gacha dulu!");
      return;
    }
    // Heal team to full at battle start
    team.forEach((m) => {
      if (typeof m.maxHp === "number") m.hp = m.maxHp;
    });
    this.setEnemy();
    this.setGachaLock(true);
    this.log(`⚔️ Battle start! Musuh: ${this.enemy.name} (HP ${this.enemy.hp})`);

    await this.tweenAsync(this.enemyContainer, { y: 140 }, 150, "Back.easeOut");
    await this.tweenAsync(this.enemyContainer, { y: 120 }, 150, "Cubic.easeOut");

    let round = 1;
    while (this.enemy.hp > 0 && team.length > 0) {
      this.log(`--- Round ${round} ---`);
      for (const member of [...team]) {
        this.punchTeamMember(member);
        await this.delay(220);

        // crit check for team attack
        const isCrit = Math.random() < this.crit.chance;
        const dmg = Math.max(1, Math.round(member.atk * (isCrit ? this.crit.mult : 1)));
        if (isCrit) this.beep(980, 70, 'square', 0.05);

        this.enemy.hp -= dmg;
        this.enemy.hp = Math.max(0, this.enemy.hp);
        this.updateEnemyUI();
        this.floatText(360, 100, isCrit ? `CRIT -${dmg}` : `-${dmg}`, isCrit ? { color: 0xffe066, size: 18 } : { color: 0xffd166, size: 14 });
        this.spawnParticles(
          360 + Phaser.Math.Between(-40, 40),
          120 + Phaser.Math.Between(-20, 20),
          8
        );
        this.log(`${member.name} deals ${dmg}${isCrit ? " (CRIT)" : ""} -> Enemy HP ${Math.max(0, this.enemy.hp)}`);

        if (this.enemy.hp <= 0) break;
      }

      if (this.enemy.hp <= 0) break;

      const targetIdx = Phaser.Math.Between(0, team.length - 1);
      const target = team[targetIdx];

      await this.enemyStrike(targetIdx);

      // enemy crit
      const eCrit = Math.random() < this.crit.chance * 0.8; // slightly lower crit chance for enemy
      const eDmg = Math.max(1, Math.round(this.enemy.atk * (eCrit ? this.crit.mult : 1)));
      target.hp -= eDmg;
      const cardBaseX = 360 - ((team.length - 1) * 140) / 2 + targetIdx * 140;
      this.floatText(cardBaseX, 330, eCrit ? `CRIT -${eDmg}` : `-${eDmg}`, eCrit ? { color: 0xff3b3b, size: 18 } : { color: 0xff5c5c, size: 14 });
      this.log(
        `${this.enemy.name} hits ${target.name} for ${eDmg}${eCrit ? " (CRIT)" : ""} -> ${Math.max(0, target.hp)} HP`
      );

      this.spawnParticles(
        cardBaseX + Phaser.Math.Between(-20, 20),
        360 + Phaser.Math.Between(-30, 30),
        8
      );

      if (target.hp <= 0) {
        this.log(`💀 ${target.name} is down!`);
        const id = target.id;
        team = team.filter((t) => t.id !== id);
        this.renderTeamSprites();
      } else {
        this.renderTeamSprites();
      }

      await this.delay(420);
      round++;
    }

    if (this.enemy.hp <= 0) {
      this.log(`🎉 Victory! ${this.enemy.name} defeated!`);
      this.beep(880, 120, 'sine', 0.05); this.delay(20);
      this.beep(1320, 160, 'sine', 0.05);
      // Reward crystals and progress wave
      const reward = 120 + (this.wave * 60);
      const before = this.getCrystals();
      this.setCrystals(before + reward);
      this.wave += 1;
      this.updateStageLabel();
      this.log(`🏆 Reward: +${reward} Crystals • Next: Stage ${this.wave}`);
      this.updateGachaBtnState?.();
      this.saveState();
      for (let i = 0; i < 45; i++) {
        const ang = Phaser.Math.Between(0, 360);
        const dist = Phaser.Math.Between(10, 200);
        const x = 360 + Math.cos(Phaser.Math.DegToRad(ang)) * dist;
        const y = 120 + Math.sin(Phaser.Math.DegToRad(ang)) * dist;
        this.spawnParticles(x, y, 1, { life: 900, size: 5, speed: 260 });
      }
      const clearedStage = this.wave - 1;
      this.showVictory?.(reward, clearedStage, this.wave);
    } else {
      this.log(`💀 Defeat... Your team was wiped.`);
    }

    this.updateEnemyUI();
    this.renderTeamSprites();
    if (!this.victoryShown) this.setGachaLock(false);
    this.updateGachaBtnState?.();
    this.saveState();
  }

  spawnParticles(x, y, qty = 6, opts = { life: 500, size: 3, speed: 120 }) {
    for (let i = 0; i < qty; i++) {
      const px = x;
      const py = y;
      const size = opts.size || 3;
      const col = 0xffffff;
      const p = this.add.circle(px, py, size, col).setDepth(60).setAlpha(1);
      const tx = px + Phaser.Math.Between(-opts.speed, opts.speed);
      const ty = py + Phaser.Math.Between(-opts.speed / 2, opts.speed / 2);
      this.tweens.add({
        targets: p,
        x: tx,
        y: ty,
        alpha: 0,
        scale: { from: 1, to: 0.2 },
        duration: opts.life || 500,
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  punchTeamMember(member) {
    const idx = team.findIndex((t) => t.id === member.id);
    if (idx < 0) return;
    const child = this.teamDisplay.getAt(idx);
    if (!child) return;
    this.tweens.add({ targets: child, scale: 1.08, duration: 90, yoyo: true });
    this.beep(520, 40, 'triangle', 0.03);
  }

  enemyStrike(targetIdx) {
    return this.tweenAsync(
      this.enemyContainer,
      { x: 360 + Phaser.Math.Between(-8, 8) },
      140,
      "Quad.easeInOut"
    )
      .then(() => this.tweenAsync(this.enemyContainer, { x: 360 }, 120, "Quad.easeInOut"))
      .then(() => {
        const child = this.teamDisplay.getAt(targetIdx);
        if (child) {
          const rect = child.getAt(0);
          this.tweens.add({
            targets: rect,
            scale: 1.06,
            duration: 80,
            yoyo: true,
          });
        }
      });
  }

  update() {}

  delay(ms) {
    return new Promise((res) => this.time.delayedCall(ms, res));
  }
  floatText(x, y, text, opts = 0xffffff) {
    let color = 0xffffff;
    let size = 14;
    if (typeof opts === 'number') {
      color = opts;
    } else if (typeof opts === 'object' && opts) {
      color = opts.color ?? color;
      size = opts.size ?? size;
    }
    const t = this.add.text(x, y, text, { color: '#ffffff', fontSize: size, fontStyle: 'bold' }).setOrigin(0.5);
    t.setTintFill(color);
    this.tweens.add({
      targets: t,
      y: y - (size > 14 ? 32 : 26),
      alpha: { from: 1, to: 0 },
      duration: size > 14 ? 620 : 540,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }
  tweenAsync(target, props, duration = 300, ease = "Power2") {
    return new Promise((res) => {
      this.tweens.add({
        targets: target,
        ...props,
        duration,
        ease,
        onComplete: res,
      });
    });
  }
  createSfxIcon() {
    const width = this.game.config.width;
    const x = width - 40;
    const y = 24;
    const container = this.add.container(x, y).setDepth(200);
    const bg = this.add.rectangle(0, 0, 64, 26, 0x000000, 0.35).setStrokeStyle(1, 0xffffff, 0.2);
    const txt = this.add.text(0, 0, "", { color: '#ffffff', fontSize: 14 }).setOrigin(0.5);
    container.add([bg, txt]);
    bg.setInteractive();
    bg.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.06, duration: 120 }));
    bg.on('pointerout', () => this.tweens.add({ targets: container, scale: 1.0, duration: 120 }));
    bg.on('pointerdown', () => {
      this.sfxMuted = !this.sfxMuted;
      this.setSfxBtnLabel?.();
      this.updateSfxIcon();
      this.saveState();
      if (!this.sfxMuted) this.beep(660, 80, 'sine', 0.05);
    });
    this.sfxIcon = { container, bg, txt };
    this.updateSfxIcon();
  }
  updateSfxIcon() {
    if (!this.sfxIcon) return;
    const icon = this.sfxMuted ? '🔇' : '🔊';
    this.sfxIcon.txt.setText(icon);
    this.sfxIcon.bg.setFillStyle(this.sfxMuted ? 0x222222 : 0x000000, 0.35);
  }
  ensureAudio() {
    if (this.audioCtx) return this.audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    this.audioCtx = new Ctx();
    return this.audioCtx;
  }
  beep(freq = 440, duration = 80, type = 'sine', volume = 0.04) {
    if (this.sfxMuted) return;
    const ctx = this.ensureAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  }

  log(msg) {
    const el = this.battleLogEl;
    const stamp = new Date().toLocaleTimeString();
    el.innerText = (el.innerText === "—" ? "" : el.innerText + "\n") + `[${stamp}] ${msg}`;
    el.scrollTop = el.scrollHeight;
    console.log(msg);
  }
}
