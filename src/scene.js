import { YOUTUBER_POOL, RATES, BUFF, ENEMY_BASE, GACHA_COST, PITY, ENEMY_THEMES, CRIT, UPGRADE, ASCEND, RARITY_STAT_MULT } from "./constants.js";
import { colorForRarity, emojiForRarity, pickRarity, pickByRarity } from "./utils.js";
import Remote from "./remote.js";

// Module-scoped team state
let team = [];
let nextId = 1;

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  preload() {}

  async create() {
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
    await this.initState();
    this.renderTeamSprites();
    this.setEnemy();
    this.createSfxIcon();
    
    // Hide loading overlay after everything is loaded
    this.hideLoadingOverlay();
  }

  setupHtmlHooks() {
    this.gachaBtn = document.getElementById("gachaBtn");
    this.battleBtn = document.getElementById("battleBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.healTeamBtn = document.getElementById("healTeamBtn");
    this.pullCount = document.getElementById("pullCount");
    this.lastPull = document.getElementById("lastPull");
    this.teamListEl = document.getElementById("teamList");
    this.battleLogEl = document.getElementById("battleLog");
    this.crystalsEl = document.getElementById("crystals");
    this.shardsEl = document.getElementById("shards");
    this.roomCodeHeader = document.getElementById("roomCodeHeader");
    this.ratesInfoEl = document.getElementById("ratesInfo");
    this.pityInfoEl = document.getElementById("pityInfo");
    this.stageLabelEl = document.getElementById("stageLabel");
    this.clearSaveBtn = document.getElementById("clearSaveBtn");
    this.saveGameBtn = document.getElementById("saveGameBtn");
    this.fullResetBtn = document.getElementById("fullResetBtn");
    this.toggleSfxBtn = document.getElementById("toggleSfxBtn");
    // Streamer modal elements
    this.streamerModal = document.getElementById("streamerModal");
    this.streamerCard = document.getElementById("streamerCard");
    this.streamerCloseBtn = document.getElementById("streamerCloseBtn");
    this.streamerHideSettingsChk = document.getElementById("streamerHideSettingsChk");
    this.streamerHideLogChk = document.getElementById("streamerHideLogChk");
    this.streamerHideRatesChk = document.getElementById("streamerHideRatesChk");
    this.streamerHideCurrencyChk = document.getElementById("streamerHideCurrencyChk");
    this.streamerHideGachaChk = document.getElementById("streamerHideGachaChk");
    this.streamerMinimalChk = document.getElementById("streamerMinimalChk");
    this.streamerDimRange = document.getElementById("streamerDimRange");
    this.streamerDimEl = document.getElementById("dimOverlay");
    this.streamerSaveGameBtn = document.getElementById("streamerSaveGameBtn");
    this.streamerFullResetBtn = document.getElementById("streamerFullResetBtn");
    // Remote control hooks
    this.allowRemoteChk = document.getElementById("allowRemoteChk");
    this.roomCodeInput = document.getElementById("roomCodeInput");
    this.copyRoomBtn = document.getElementById("copyRoomBtn");
    this.openControlLink = document.getElementById("openControlLink");
    // Remote governance / audit elements
    this.streamerRemoteLockChk = document.getElementById("streamerRemoteLockChk");
    this.streamerRemoteLevelSel = document.getElementById("streamerRemoteLevelSel");
    this.remoteAuditLog = document.getElementById("remoteAuditLog");
    // Developer panel hooks
    this.devPanel = document.getElementById("devPanel");
    this.devC100 = document.getElementById("devC100");
    this.devC1000 = document.getElementById("devC1000");
    this.devS10 = document.getElementById("devS10");
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
    // Game over elements
    this.gameOverModal = document.getElementById("gameOverModal");
    this.gameOverCard = document.getElementById("gameOverCard");
    this.gameOverTextEl = document.getElementById("gameOverText");
    this.gameOverResetBtn = document.getElementById("gameOverResetBtn");
    this.gameOverCloseBtn = document.getElementById("gameOverCloseBtn");
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
    const getShards = () => Number(this.shardsEl?.innerText || 0) || 0;
    const setShards = (val) => {
      if (this.shardsEl) this.shardsEl.innerText = String(Math.max(0, Number(val) || 0));
    };
    this.getShards = getShards;
    this.setShards = setShards;
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

    // Cost helpers
    this._rarityMult = (rarity) => (UPGRADE?.rarityCostMult?.[rarity] ?? 1);
    this._statMult = (member) => (RARITY_STAT_MULT?.[member?.rarity] ?? 1);
    this.perLevelAtk = (member) => {
      const mult = this._statMult(member);
      return Math.max(1, Math.round(BUFF.atkPerLevel * mult));
    };
    this.perLevelHp = (member) => {
      const mult = this._statMult(member);
      return Math.max(1, Math.round(BUFF.hpPerLevel * mult));
    };
    this.upgradeCostCrystals = (member) => {
      const lvl = Math.max(1, Number(member?.level) || 1);
      const base = Math.max(UPGRADE.base, UPGRADE.base + UPGRADE.perLevel * (lvl - 1));
      return Math.round(base * this._rarityMult(member?.rarity));
    };
    this.upgradeCostShards = (member) => {
      const shards = Math.max(1, Number(UPGRADE.shard) || 1);
      return Math.max(1, Math.round(shards * this._rarityMult(member?.rarity)));
    };
    this.ascendCostShards = (member) => {
      const base = Math.max(1, Number(ASCEND.shards) || 1);
      const mult = ASCEND?.rarityShardMult?.[member?.rarity] ?? 1;
      return Math.max(1, Math.round(base * mult));
    };
    this.ascendBonuses = (member) => {
      const rank = Math.max(1, Number(member?.rank) || 1);
      const mult = this._statMult(member);
      const scale = 1 + (Number(ASCEND.rankScale) || 0) * (rank - 1);
      const atk = Math.max(1, Math.round(ASCEND.atkBonus * mult * scale));
      const hp = Math.max(1, Math.round(ASCEND.hpBonus * mult * scale));
      return { atk, hp };
    };
    this.healCost = (member) => {
      if (!member) return 0;
      const maxHp = member.maxHp || member.hp || 0;
      const curHp = member.hp || 0;
      if (maxHp <= 0 || curHp >= maxHp) return 0;
      const missingPct = 1 - curHp / maxHp;
      const base = 35; // lowered base crystal cost
      const rarityMult = this._rarityMult(member.rarity);
      return Math.max(1, Math.round(base * missingPct * rarityMult));
    };

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
    this.streamerMode = true;
    this.victoryShown = false;
    this.devMode = false;
    this.remoteAllowed = false;
    this.roomCode = "";
    // Remote governance state
    this.remoteLock = false; // when true, all remote actions are ignored
    this.remotePermissionLevel = 2; // 1=basic,2=power,3=admin
    this._remoteCooldowns = {}; // action -> next usable timestamp
    this._remoteAudit = []; // recent audit entries
    this._remoteAuditMax = 10; // keep only last 10 entries per spec
    const updateStageLabel = () => {
      if (this.stageLabelEl) this.stageLabelEl.textContent = `Stage ${this.wave}`;
    };
    this.updateStageLabel = updateStageLabel;
    updateStageLabel();

    // Streamer Mode UI helpers
    const applyStreamerMode = () => {
      const on = true; // always-on streamer mode
      const prefs = this.streamerPrefs || { hideSettings: true, hideLog: true, hideRates: true, hideCurrency: false, hideGacha: false, dim: 0, minimal: false };
      const settingsPanel = document.getElementById("settingsPanel");
      const battleLogPanel = this.battleLogEl?.closest?.(".panel-block");
      const headerCurrency = document.querySelector('.currency');
      const gachaSection = document.querySelector('.gacha-section');
      if (settingsPanel) settingsPanel.style.display = on && prefs.hideSettings ? "none" : "";
      if (battleLogPanel) battleLogPanel.style.display = on && prefs.hideLog ? "none" : "";
      if (this.ratesInfoEl) this.ratesInfoEl.style.display = on && prefs.hideRates ? "none" : "";
      if (this.pityInfoEl) this.pityInfoEl.style.display = on && prefs.hideRates ? "none" : "";
      if (headerCurrency) headerCurrency.style.display = on && prefs.hideCurrency ? 'none' : '';
      if (gachaSection) gachaSection.style.display = on && prefs.hideGacha ? 'none' : '';
      if (this.streamerDimEl) this.streamerDimEl.style.background = `rgba(0,0,0,${Math.max(0, Math.min(0.7, Number(prefs.dim) || 0))})`;
      // sync checkboxes if modal exists
      if (this.streamerHideSettingsChk) this.streamerHideSettingsChk.checked = !!prefs.hideSettings;
      if (this.streamerHideLogChk) this.streamerHideLogChk.checked = !!prefs.hideLog;
      if (this.streamerHideRatesChk) this.streamerHideRatesChk.checked = !!prefs.hideRates;
      if (this.streamerHideCurrencyChk) this.streamerHideCurrencyChk.checked = !!prefs.hideCurrency;
      if (this.streamerHideGachaChk) this.streamerHideGachaChk.checked = !!prefs.hideGacha;
      if (this.streamerMinimalChk) this.streamerMinimalChk.checked = !!prefs.minimal;
      if (this.streamerDimRange) this.streamerDimRange.value = String(prefs.dim ?? 0);
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
      console.log("🎰 After gacha, team array:", team.length, team.map(m => m.name));
      const last = results[results.length - 1];
      this.lastPull.innerText = `Last: ${emojiForRarity(last.rarity)} ${last.name} (Lv ${last.level}) — Spent ${spent}`;
      this.log(
        `🎰 Gacha: ${results
          .map((r) => `${emojiForRarity(r.rarity)} ${r.name} (Lv ${r.level})`)
          .join(", ")} • Cost ${spent}`
      );
      this.renderTeamSprites();
      // Use enhanced flashy reveal
      this.showGachaReveal?.(results, spent);
      updateGachaBtnState();
      this.saveState();
    };

    this.battleBtn.onclick = async () => {
      this.battleBtn.disabled = true;
      await this.runBattle();
      this.battleBtn.disabled = false;
    };

    this.resetBtn.onclick = () => {
      const ok = window.confirm("Yakin reset team? Aksi ini tidak bisa dibatalkan.");
      if (!ok) return;
      team = [];
      nextId = 1;
      this.renderTeamSprites();
      this.log("♻️ Team reset.");
      updateGachaBtnState();
      this.saveState();
    };

    this.healTeamBtn?.addEventListener('click', () => {
      if (team.length === 0) { this.log('⚠️ Tidak ada anggota untuk heal'); return; }
      const damaged = team.filter(m => (m.maxHp || m.hp) > m.hp);
      if (damaged.length === 0) { this.log('✅ Semua anggota sudah full HP'); return; }
      const totalCost = damaged.reduce((sum, m) => sum + this.healCost(m), 0);
      const crystals = this.getCrystals?.() ?? 0;
      if (crystals < totalCost) { this.log(`❌ Crystals kurang untuk heal: butuh ${totalCost}`); return; }
      this.setCrystals?.(crystals - totalCost);
      damaged.forEach(m => { m.hp = m.maxHp || m.hp; });
      this.log(`🩹 Heal Team: ${damaged.length} anggota • Cost ${totalCost}💰`);
      this.renderTeamSprites();
      this.saveState();
    });

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
      const ok = window.confirm("Yakin hapus save lokal? Ini akan reset semua progres (halaman tidak direload).");
      if (!ok) return;
      try { localStorage.removeItem("cc_state_v1"); } catch {}
      // reset runtime state
      team = [];
      nextId = 1;
      this.wave = 1;
      this.pityEpic = 0;
      this.pityLegend = 0;
      this.setCrystals(900);
      this.setShards(0);
      this.updateStageLabel();
      this.updateGachaBtnState();
      this.updatePityInfo();
      this.renderTeamSprites();
      this.setEnemy();
      this.log("🧹 Save cleared. State reset to defaults.");
      this.saveState();
    });
    // Manual save
    this.saveGameBtn?.addEventListener("click", () => {
      this.saveState();
      this.log("💾 Manual save disimpan.");
    });
    // Full reset helper
    const doFullReset = () => {
      const input = window.prompt("Full Reset: ketik YES untuk menghapus semua progres dan reload.", "");
      if (!input || input.trim().toUpperCase() !== "YES") { this.log("❎ Full Reset dibatalkan."); return; }
      try { localStorage.removeItem("cc_state_v1"); } catch {}
      team = [];
      nextId = 1;
      this.wave = 1;
      this.pityEpic = 0;
      this.pityLegend = 0;
      this.setCrystals(900);
      this.setShards(0);
      this.updateStageLabel();
      this.updateGachaBtnState();
      this.updatePityInfo?.();
      this.renderTeamSprites();
      this.setEnemy();
      this.log("♻️ Full reset selesai. Reload...");
      this.saveState();
      setTimeout(() => { try { location.reload(); } catch {} }, 600);
    };
    this.fullResetBtn?.addEventListener("click", doFullReset);
    this.streamerFullResetBtn?.addEventListener("click", doFullReset);
    this.streamerSaveGameBtn?.addEventListener("click", () => {
      this.saveState();
      this.log("💾 Manual save disimpan (Streamer Mode).");
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

    // Streamer Mode modal: open/close via 'S'
    this.showStreamer = () => {
      if (!this.streamerModal) return;
      this.streamerModal.style.display = 'flex';
      requestAnimationFrame(() => { if (this.streamerCard) { this.streamerCard.style.opacity = '1'; this.streamerCard.style.transform = 'scale(1)'; } });
      if (!this.sfxMuted) this.beep(680, 70, 'sine', 0.04);
    };
    this.hideStreamer = () => {
      if (!this.streamerModal) return;
      if (this.streamerCard) { this.streamerCard.style.opacity = '0'; this.streamerCard.style.transform = 'scale(0.96)'; }
      setTimeout(() => { if (this.streamerModal) this.streamerModal.style.display = 'none'; }, 180);
    };
    this.streamerCloseBtn?.addEventListener('click', () => this.hideStreamer());
    if (this.streamerModal) {
      // click outside to close
      this.streamerModal.addEventListener('mousedown', (ev) => {
        if (this.streamerCard && !this.streamerCard.contains(ev.target)) this.hideStreamer();
      });
    }
    this._streamerKeyHandler = (e) => {
      if (e.repeat) return;
      if (e.key && e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const open = this.streamerModal && this.streamerModal.style.display !== 'none';
        if (open) this.hideStreamer(); else this.showStreamer();
      }
    };
    window.addEventListener('keydown', this._streamerKeyHandler);

    // Wire checkbox changes -> apply + save
    const savePrefs = () => {
      this.streamerPrefs = this.streamerPrefs || { hideSettings: true, hideLog: true, hideRates: true, hideCurrency: false, hideGacha: false, dim: 0, minimal: false };
      this.streamerPrefs.hideSettings = !!this.streamerHideSettingsChk?.checked;
      this.streamerPrefs.hideLog = !!this.streamerHideLogChk?.checked;
      this.streamerPrefs.hideRates = !!this.streamerHideRatesChk?.checked;
      this.streamerPrefs.hideCurrency = !!this.streamerHideCurrencyChk?.checked;
      this.streamerPrefs.hideGacha = !!this.streamerHideGachaChk?.checked;
      const dimVal = Number(this.streamerDimRange?.value || 0);
      this.streamerPrefs.dim = isNaN(dimVal) ? 0 : Math.max(0, Math.min(0.7, dimVal));
      // Minimal mode preset
      const minimal = !!this.streamerMinimalChk?.checked;
      this.streamerPrefs.minimal = minimal;
      if (minimal) {
        this.streamerPrefs.hideSettings = true;
        this.streamerPrefs.hideLog = true;
        this.streamerPrefs.hideRates = true;
        this.streamerPrefs.hideCurrency = true;
        this.streamerPrefs.hideGacha = true;
        if ((this.streamerPrefs.dim ?? 0) < 0.25) this.streamerPrefs.dim = 0.35;
      }
      this.applyStreamerMode();
      this.saveState();
    };
    this.streamerHideSettingsChk?.addEventListener('change', savePrefs);
    this.streamerHideLogChk?.addEventListener('change', savePrefs);
    this.streamerHideRatesChk?.addEventListener('change', savePrefs);
    this.streamerHideCurrencyChk?.addEventListener('change', savePrefs);
    this.streamerHideGachaChk?.addEventListener('change', savePrefs);
    this.streamerMinimalChk?.addEventListener('change', savePrefs);
    this.streamerDimRange?.addEventListener('input', savePrefs);

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
        // Game Over wiring
        // Centralized soft reset to Stage 1 (no hard clear of localStorage key)
        this.resetGameToStage1 = () => {
          team = [];
          nextId = 1;
          this.wave = 1;
          this.pityEpic = 0;
          this.pityLegend = 0;
          this.setCrystals(900);
          this.setShards(0);
          this.updateStageLabel();
          this.renderTeamSprites();
          this.setEnemy();
          this.setGachaLock(false);
          this.saveState();
          this.log('↩ Game reset ke Stage 1.');
        };
        this.showGameOver = (wave) => {
          if (!this.gameOverModal) return;
          this.gameOverTextEl && (this.gameOverTextEl.textContent = `Tim kamu kalah di Stage ${wave}. `);
          this.gameOverModal.style.display = 'flex';
          requestAnimationFrame(() => {
            if (this.gameOverCard) { this.gameOverCard.style.opacity = '1'; this.gameOverCard.style.transform = 'scale(1)'; }
          });
          if (!this.sfxMuted) { this.beep(320, 140, 'sine', 0.06); this.time.delayedCall(120, () => this.beep(250, 160, 'sine', 0.06)); }
        };
        this.hideGameOver = () => {
          if (!this.gameOverModal) return;  
          if (this.gameOverCard) { this.gameOverCard.style.opacity = '0'; this.gameOverCard.style.transform = 'scale(0.96)'; }
          setTimeout(() => { if (this.gameOverModal) this.gameOverModal.style.display = 'none'; }, 180);
        };
        // Close only hides the modal; player chooses when to reset
        this.gameOverCloseBtn?.addEventListener('click', () => {
          this.hideGameOver?.();
        });
        this.gameOverResetBtn?.addEventListener('click', () => {
          this.resetGameToStage1?.();
          this.hideGameOver?.();
        });

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
    const addShards = (amt) => {
      if (guardBattle()) return;
      const before = this.getShards?.() ?? 0;
      this.setShards?.(before + amt);
      this.saveState();
      this.log(`🧪 Dev: +${amt} Shards (now ${before + amt})`);
    };
    const addByRarity = (rarity) => {
      if (guardBattle()) return;
      const sample = pickByRarity(YOUTUBER_POOL, rarity);
      const existing = team.find((c) => c.name === sample.name);
      if (existing) {
        existing.level += 1;
        existing.atk += this.perLevelAtk(existing);
        existing.hp += this.perLevelHp(existing);
        existing.maxHp = (existing.maxHp || existing.hp);
        existing.maxHp += this.perLevelHp(existing);
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
        existing.level += 1; existing.atk += this.perLevelAtk(existing); existing.hp += this.perLevelHp(existing); existing.maxHp = (existing.maxHp || existing.hp) + this.perLevelHp(existing);
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
    this.devS10?.addEventListener('click', () => addShards(10));
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
    this.devToggleStream?.addEventListener('click', () => { this.showStreamer?.(); });

    // expose dev actions for remote control
    this.devActions = { addCrystals, addShards, addByRarity, addByName, setStage, setEnemyHp, forceWin, fullHeal };

    // Remote control logic (opt-in)
    const randRoom = () => (Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || "ROOM01");
    const setRoomUi = () => {
      if (this.roomCodeInput) this.roomCodeInput.value = this.remoteAllowed ? this.roomCode : '';
      if (this.openControlLink) {
        const base = location.origin + location.pathname.replace(/index\.html?$/, '');
        const url = new URL(base + 'control.html');
        if (this.remoteAllowed && this.roomCode) url.hash = '#room=' + this.roomCode;
        this.openControlLink.href = url.toString();
      }
      if (this.roomCodeHeader) {
        this.roomCodeHeader.textContent = (this.remoteAllowed && this.roomCode) ? this.roomCode : '(off)';
      }
    };
    this._remoteConnected = false;
    const connectRemote = async () => {
      if (!this.remoteAllowed) return;
      if (!this.roomCode) this.roomCode = randRoom();
      try {
        await Remote.connect(this.roomCode);
        await Remote.subscribe((data) => this.handleRemoteEvent?.(data));
        this._remoteConnected = true;
        this.log(`🛰 Remote connected (room ${this.roomCode})`);
      } catch (e) {
        this._remoteConnected = false;
        this.log('⚠️ Remote connect failed');
      }
      setRoomUi(); this.saveState();
    };
    const disconnectRemote = async () => {
      try { await Remote.disconnect(); } catch {}
      this._remoteConnected = false; setRoomUi(); this.saveState();
      this.log('🛰 Remote disconnected');
    };
    this.handleRemoteEvent = (msg) => {
      if (!msg || !msg.type) return;
      // Ignore acknowledgements / status events to prevent loops
      if (msg.type === 'remoteAck' || msg.type === 'remoteStatus') return;
      // basic debouncing
      const now = Date.now();
      if (!this._lastRemote || now - this._lastRemote > 120) this._lastRemote = now; else return;
      // lock check
      if (this.remoteLock) {
        try { Remote.publish('remoteAck', { action: msg.type, status: 'locked' }); } catch {}
        return;
      }

      // Registry describing remote actions
      if (!this.remoteActions) {
        const A = this.devActions;
        this.remoteActions = {
          addCrystals: { level: 1, cooldown: 3000, exec: (p) => A?.addCrystals?.(Math.max(1, Math.min(500, parseInt(p?.amount, 10) || 0))) },
          fullHeal: { level: 2, cooldown: 10000, exec: () => A?.fullHeal?.() },
            forceVictory: { level: 3, cooldown: 15000, exec: () => A?.forceWin?.() },
          addByRarity: { level: 2, cooldown: 5000, exec: (p) => { const r = String(p?.rarity||'').toLowerCase(); if(['common','rare','epic','legend'].includes(r)) A?.addByRarity?.(r); } },
          addByName: { level: 3, cooldown: 8000, exec: (p) => { const n = (p?.name||'').trim(); if(n) A?.addByName?.(n); } },
          setStage: { level: 3, cooldown: 12000, exec: (p) => { const s = parseInt(p?.stage,10); if(!isNaN(s)) A?.setStage?.(Math.max(1, Math.min(999, s))); } },
          setEnemyHp: { level: 2, cooldown: 5000, exec: (p) => { const hp = parseInt(p?.hp,10); if(!isNaN(hp) && this.enemy) A?.setEnemyHp?.(Math.max(1, Math.min(this.enemy.hp*4, hp))); } },
          spawnFx: { level: 1, cooldown: 2000, exec: () => { this._spawnRemoteFx?.(); } },
          showMessage: { level: 1, cooldown: 5000, exec: (p) => { const txt = (p?.text||'').trim().slice(0,60); if(txt) this._showRemoteOverlayMessage?.(txt); } },
        };
      }
      const action = this.remoteActions[msg.type];
      if (!action) {
        try { Remote.publish('remoteAck', { action: msg.type, status: 'unknown' }); } catch {}
        return;
      }
      // permission level check
      if (action.level > this.remotePermissionLevel) {
        try { Remote.publish('remoteAck', { action: msg.type, status: 'denied' }); } catch {}
        return;
      }
      // cooldown check
      const nextOk = this._remoteCooldowns[msg.type] || 0;
      if (now < nextOk) {
        try { Remote.publish('remoteAck', { action: msg.type, status: 'cooldown', left: nextOk - now }); } catch {}
        return;
      }
      let ok = false;
      try { action.exec?.(msg.payload || {}); ok = true; } catch (e) { ok = false; }
      if (ok) {
        this._remoteCooldowns[msg.type] = now + (action.cooldown || 0);
        this._pushRemoteAudit(`${msg.type}`);
        try { Remote.publish('remoteAck', { action: msg.type, status: 'ok', next: this._remoteCooldowns[msg.type] }); } catch {}
      } else {
        try { Remote.publish('remoteAck', { action: msg.type, status: 'error' }); } catch {}
      }
    };
    const onRemoteToggle = async () => {
      if (this.allowRemoteChk?.checked) {
        this.remoteAllowed = true; if (!this.roomCode) this.roomCode = randRoom(); await connectRemote();
      } else { this.remoteAllowed = false; await disconnectRemote(); }
      setRoomUi(); this.saveState();
    };
    // Governance UI listeners
    if (this.streamerRemoteLockChk) {
      this.streamerRemoteLockChk.addEventListener('change', () => {
        this.remoteLock = !!this.streamerRemoteLockChk.checked;
        this._pushRemoteAudit(this.remoteLock ? 'LOCKED' : 'UNLOCKED');
        try { Remote.publish('remoteStatus', { lock: this.remoteLock, level: this.remotePermissionLevel }); } catch {}
        this.saveState();
      });
    }
    if (this.streamerRemoteLevelSel) {
      this.streamerRemoteLevelSel.addEventListener('change', () => {
        const lv = parseInt(this.streamerRemoteLevelSel.value,10);
        if(!isNaN(lv)) this.remotePermissionLevel = Math.max(1, Math.min(3, lv));
        this._pushRemoteAudit(`perm=${this.remotePermissionLevel}`);
        try { Remote.publish('remoteStatus', { lock: this.remoteLock, level: this.remotePermissionLevel }); } catch {}
        this.saveState();
      });
    }
    this.allowRemoteChk?.addEventListener('change', onRemoteToggle);
    this.copyRoomBtn?.addEventListener('click', async () => {
      if (!this.remoteAllowed || !this.roomCode) return;
      try { await navigator.clipboard.writeText(this.roomCode); this.log('📋 Room copied'); } catch {}
    });

    // === Auto-enable Remote Control (streamer doesn't need to tick checkbox) ===
    // If remote was not previously allowed (fresh session), turn it on automatically.
    // Preserve existing user choice if they had disabled it in a prior saved state.
    if (this.allowRemoteChk && !this.remoteAllowed) {
      this.remoteAllowed = true;
      this.allowRemoteChk.checked = true;
      if (!this.roomCode) this.roomCode = randRoom();
      setRoomUi();
      // Connect immediately if not already connected
      if (!this._remoteConnected) {
        connectRemote();
        this.log(`🛰 Remote auto-enabled (room ${this.roomCode})`);
      }
      // Note: saveState() will be called after initState() loads existing data
    } else if (this.allowRemoteChk && this.remoteAllowed) {
      // Ensure checkbox reflects restored state and connect if needed
      this.allowRemoteChk.checked = true;
      if (!this._remoteConnected) connectRemote();
      setRoomUi();
    }
    // === End auto-enable ===
  }

  hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }
  }

  showSaveIndicator() {
    // Quick flash to show game is saving
    const indicator = document.createElement('div');
    indicator.textContent = '💾 Saved';
    indicator.style.position = 'fixed';
    indicator.style.top = '20px';
    indicator.style.right = '20px';
    indicator.style.padding = '8px 16px';
    indicator.style.background = 'rgba(102,194,255,0.9)';
    indicator.style.color = '#071018';
    indicator.style.borderRadius = '8px';
    indicator.style.fontWeight = '700';
    indicator.style.fontSize = '14px';
    indicator.style.zIndex = '10000';
    indicator.style.opacity = '0';
    indicator.style.transition = 'opacity 0.2s ease';
    document.body.appendChild(indicator);
    requestAnimationFrame(() => { indicator.style.opacity = '1'; });
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => { indicator.remove(); }, 200);
    }, 1500);
  }

  async initState() {
    try {
      const raw = localStorage.getItem("cc_state_v1");
      if (!raw) {
        console.log("📂 No save data found, starting fresh");
        return;
      }
      const state = JSON.parse(raw);
      console.log("📂 Loading save data:", { team: state.team?.length, teamNames: state.team?.map(t => t.name), crystals: state.crystals, wave: state.wave });
      if (Array.isArray(state.team)) {
        // restore team and nextId (add defaults for new props)
        team = state.team.map((m) => ({
          ...m,
          locked: !!m.locked,
          rank: m.rank || 1,
        }));
        nextId = typeof state.nextId === "number" ? state.nextId : (team.reduce((mx, m) => Math.max(mx, m.id || 0), 0) + 1);
      }
      if (typeof state.crystals === "number") {
        this.setCrystals(state.crystals);
      }
      if (typeof state.shards === "number") {
        this.setShards(state.shards);
      }
      if (typeof state.wave === "number" && state.wave >= 1) {
        this.wave = state.wave;
      }
      if (typeof state.pityEpic === "number") this.pityEpic = state.pityEpic;
      if (typeof state.pityLegend === "number") this.pityLegend = state.pityLegend;
      if (state.streamerPrefs && typeof state.streamerPrefs === 'object') {
        this.streamerPrefs = {
          hideSettings: !!state.streamerPrefs.hideSettings,
          hideLog: !!state.streamerPrefs.hideLog,
          hideRates: !!state.streamerPrefs.hideRates,
          hideCurrency: !!state.streamerPrefs.hideCurrency,
          hideGacha: !!state.streamerPrefs.hideGacha,
          dim: typeof state.streamerPrefs.dim === 'number' ? state.streamerPrefs.dim : 0,
          minimal: !!state.streamerPrefs.minimal,
        };
      } else {
        this.streamerPrefs = { hideSettings: true, hideLog: true, hideRates: true, hideCurrency: false, hideGacha: false, dim: 0, minimal: false };
      }
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
      // Paksa streamerMode selalu aktif
      this.streamerMode = true;
      if (typeof state.remoteAllowed === "boolean") this.remoteAllowed = state.remoteAllowed;
      if (typeof state.roomCode === "string") this.roomCode = state.roomCode;
      if (typeof state.remoteLock === 'boolean') this.remoteLock = state.remoteLock;
      if (typeof state.remotePermissionLevel === 'number') this.remotePermissionLevel = Math.max(1, Math.min(3, state.remotePermissionLevel));
      if (this.streamerRemoteLockChk) this.streamerRemoteLockChk.checked = !!this.remoteLock;
      if (this.streamerRemoteLevelSel) this.streamerRemoteLevelSel.value = String(this.remotePermissionLevel);
      this.updateStageLabel?.();
      this.updateGachaBtnState?.();
      this.updatePityInfo?.();
      this.updateRatesInfo?.();
      this.fillSettingsInputs?.();
      this.setSfxBtnLabel?.();
      this.updateSfxIcon?.();
      this.applyStreamerMode?.();
      if (this.allowRemoteChk) this.allowRemoteChk.checked = !!this.remoteAllowed;
      // connect remote if allowed
      try { if (this.remoteAllowed) {
        const base = location.origin + location.pathname.replace(/index\.html?$/, '');
        if (this.openControlLink) {
          const url = new URL(base + 'control.html');
          if (this.roomCode) url.hash = '#room=' + this.roomCode;
          this.openControlLink.href = url.toString();
        }
        await Remote.connect(this.roomCode || (this.roomCode = (Math.random().toString(36).toUpperCase().slice(2,8))));
        await Remote.subscribe((data) => this.handleRemoteEvent?.(data));
        this._remoteConnected = true;
      }} catch {}
      // Save state after loading to persist any new defaults (e.g., remote auto-enable)
      // This only happens if setupHtmlHooks set remoteAllowed=true for first-time users
      this.saveState();
    } catch (e) {
      console.warn("Failed to load state:", e);
    }
  }

  saveState() {
    try {
      console.log("💾 Saving... Current team array:", team.length, team.map(m => m.name));
      const teamSave = team.map(m => ({
        id: m.id,
        name: m.name,
        atk: m.atk,
        hp: m.hp,
        maxHp: m.maxHp,
        level: m.level,
        rarity: m.rarity,
        locked: !!m.locked,
        rank: m.rank || 1,
      }));
      const state = {
        team: teamSave,
        nextId,
        crystals: this.getCrystals?.() ?? 0,
        shards: this.getShards?.() ?? 0,
        wave: this.wave ?? 1,
        pityEpic: this.pityEpic ?? 0,
        pityLegend: this.pityLegend ?? 0,
        rates: this.rates,
        pityConfig: this.pityConfig,
        crit: this.crit,
        sfxMuted: this.sfxMuted,
        streamerMode: this.streamerMode,
        streamerPrefs: this.streamerPrefs || { hideSettings: true, hideLog: true, hideRates: true },
        remoteAllowed: this.remoteAllowed,
        roomCode: this.roomCode,
        remoteLock: this.remoteLock,
        remotePermissionLevel: this.remotePermissionLevel,
      };
      localStorage.setItem("cc_state_v1", JSON.stringify(state));
      console.log("💾 Game saved:", { team: teamSave.length, teamNames: teamSave.map(t => t.name), crystals: state.crystals, wave: state.wave });
      this.showSaveIndicator();
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
  }

  _pushRemoteAudit(msg) {
    const ts = new Date().toLocaleTimeString();
    this._remoteAudit.push(`[${ts}] ${msg}`);
    if (this._remoteAudit.length > this._remoteAuditMax) this._remoteAudit.shift();
    if (this.remoteAuditLog) {
      const html = this._remoteAudit.map((line,i,arr)=>{
        const isLast = i === arr.length - 1;
        return `<div class="audit-entry${isLast? ' latest':''}">${line}</div>`;
      }).join("");
      this.remoteAuditLog.innerHTML = html;
    }
  }

  _showRemoteOverlayMessage(text) {
    // Simple ephemeral overlay using battle log + optional screen text
    this.log(`🗨️ ${text}`);
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'absolute';
    el.style.left = '50%';
    el.style.top = '60%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.padding = '6px 10px';
    el.style.background = 'rgba(0,0,0,0.6)';
    el.style.color = '#fff';
    el.style.fontSize = '18px';
    el.style.borderRadius = '6px';
    el.style.pointerEvents = 'none';
    el.style.opacity = '0';
    el.style.transition = 'opacity 150ms';
    document.body.appendChild(el);
    requestAnimationFrame(()=>{ el.style.opacity='1'; });
    setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>{ el.remove(); },180); }, 2400);
  }

  _spawnRemoteFx() {
    // Simple visual burst
    const x = 360 + (Math.random()*300-150);
    const y = 240 + (Math.random()*180-90);
    const size = 20 + Math.random()*30;
    const color = 0xffe500;
    const rect = this.add.rectangle(x,y,size,size,color).setStrokeStyle(2,0x222222);
    this.tweens.add({ targets: rect, scale: 0.3, alpha: 0, duration: 700, onComplete:()=>rect.destroy() });
  }

  setEnemy() {
    const theme = ENEMY_THEMES[(this.wave - 1) % ENEMY_THEMES.length] || ENEMY_THEMES[0];
    const teamScale = Math.max(1, 1 + team.length * 0.15);
    const stageScale = 1 + (this.wave - 1) * 0.12; // reduced HP growth (Package A)
    const baseHp = theme.hp * stageScale;
    const baseAtk = theme.atk * (1 + (this.wave - 1) * 0.06); // reduced ATK growth (Package A)
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
      if (existing.rank == null) existing.rank = 1;
      if (existing.locked == null) existing.locked = false;
      existing.level += 1;
      existing.atk += this.perLevelAtk(existing);
      existing.hp += this.perLevelHp(existing);
      if (typeof existing.maxHp === "number") {
        existing.maxHp += this.perLevelHp(existing);
      } else {
        existing.maxHp = existing.hp;
      }
      if (existing.level % 5 === 0) {
        const before = this.getShards?.() ?? 0;
        this.setShards?.(before + 1);
        this.log(`🎁 Milestone ${existing.name} Lv ${existing.level}: +1 Shard`);
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
        rank: 1,
        locked: false,
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
          <div class="team-name">${emojiForRarity(m.rarity)} ${m.name}${m.locked ? ' <span title="Locked">🔒</span>' : ''}</div>
          <div class="team-meta">Lv ${m.level} • HP ${m.hp} • ATK ${m.atk} ${m.rank ? `• Rank ${m.rank}` : ''}</div>
        </div>
        <div style="text-align:right; position:relative">
          <button class="btn-secondary team-action-btn" data-id="${m.id}" style="font-size:12px;padding:6px 8px">⚡+</button>
        </div>
      `;
      this.teamListEl.appendChild(div);

      // Context menu logic (polished)
      const btn = div.querySelector(".team-action-btn");
      btn?.addEventListener("click", (e) => {
        e.stopPropagation();
        // Remove any existing menu
        document.querySelectorAll('.team-context-menu').forEach(el => el.remove());
        const ascendEligible = m.level >= ASCEND.levelReq;
        const costCrystal = this.upgradeCostCrystals(m);
        const needShards = this.upgradeCostShards(m);
        const haveC = (this.getCrystals?.() ?? 0) >= costCrystal;
        const haveS = (this.getShards?.() ?? 0) >= needShards;
        const canUpgrade = haveC && haveS && !m.locked;
        const upgradeTitle = canUpgrade ? '' : (!haveC ? `Butuh ${costCrystal} Crystals` : (!haveS ? `Butuh ${needShards} Shard` : (m.locked ? 'Unlock dulu' : '')));
        const needAscShards = this.ascendCostShards(m);
        const haveAscShards = (this.getShards?.() ?? 0) >= needAscShards;
        const canAscend = ascendEligible && haveAscShards && !m.locked;
        const ascendTitle = canAscend ? '' : (!ascendEligible ? `Butuh Lv ${ASCEND.levelReq}` : (!haveAscShards ? `Butuh ${needAscShards} Shard` : (m.locked ? 'Unlock dulu' : '')));
        // Build menu
        const menu = document.createElement('div');
        menu.className = 'team-context-menu';
        menu.style.position = 'absolute';
        menu.style.top = '28px';
        menu.style.right = '0';
        menu.style.zIndex = '100';
        const healCost = this.healCost(m);
        const canHeal = healCost > 0 && (this.getCrystals?.() ?? 0) >= healCost;
        const healTitle = canHeal ? '' : (healCost === 0 ? 'Sudah full HP' : `Butuh ${healCost} Crystals`);
        menu.innerHTML = `
          <div class="menu-item ${canUpgrade ? '' : 'disabled'}" data-action="upgrade" title="${upgradeTitle}">⬆️ <span>Upgrade</span> <span style="opacity:.8">(${costCrystal}💰 + ${needShards}🔷)</span></div>
          <div class="menu-item ${canAscend ? '' : 'disabled'}" data-action="ascend" title="${ascendTitle}">🌟 <span>Ascend</span> <span style=\"opacity:.8\">(${needAscShards}🔷)</span></div>
          <div class="menu-item ${canHeal ? '' : 'disabled'}" data-action="heal" title="${healTitle}">🩹 <span>Heal</span> <span style=\"opacity:.8\">(${healCost}💰)</span></div>
          <div class="menu-sep"></div>
          <div class="menu-item" data-action="lock">${m.locked ? '🔓 <span>Unlock</span>' : '🔒 <span>Lock</span>'}</div>
          <div class="menu-item" data-action="info">ℹ️ <span>Info</span></div>
        `;
        btn.parentElement.appendChild(menu);

        // Menu item handler
        menu.querySelectorAll('.menu-item').forEach(item => {
          item.addEventListener('click', (ev) => {
            const action = item.getAttribute('data-action');
            if (item.classList.contains('disabled')) return;
            if (action === 'upgrade') {
              const cost = this.upgradeCostCrystals(m);
              const need = this.upgradeCostShards(m);
              const curC = this.getCrystals?.() ?? 0;
              const curS = this.getShards?.() ?? 0;
              if (m.locked) { this.log(`❌ ${m.name} terkunci`); return; }
              if (curC < cost) { this.log(`❌ Crystals kurang: butuh ${cost}`); return; }
              if (curS < need) { this.log(`❌ Shard kurang: butuh ${need}`); return; }
              this.setCrystals?.(curC - cost);
              this.setShards?.(curS - need);
              m.level++;
              m.atk += this.perLevelAtk(m);
              m.hp += this.perLevelHp(m);
              if (typeof m.maxHp === "number") {
                m.maxHp += this.perLevelHp(m);
              } else {
                m.maxHp = m.hp;
              }
              this.log(`⬆️ Upgrade ${m.name} -> Lv ${m.level} • Spent ${cost}💰 + ${need}🔷`);
              this.renderTeamSprites();
              this.updateGachaBtnState?.();
              this.saveState();
            } else if (action === 'ascend') {
              if (!m.rank) m.rank = 1;
              const need = this.ascendCostShards(m);
              const curS = this.getShards?.() ?? 0;
              if (m.locked) { this.log(`❌ ${m.name} terkunci`); return; }
              if (m.level < ASCEND.levelReq) { this.log(`❌ Ascend gagal: butuh Lv ${ASCEND.levelReq}`); return; }
              if (curS < need) { this.log(`❌ Shard kurang: butuh ${need}`); return; }
              this.setShards?.(curS - need);
              m.rank++;
              m.level = 1;
              const bonus = this.ascendBonuses(m);
              m.atk += bonus.atk;
              m.hp += bonus.hp;
              if (typeof m.maxHp === "number") m.maxHp += bonus.hp; else m.maxHp = m.hp;
              this.log(`🌟 Ascend ${m.name} -> Rank ${m.rank} (+${bonus.atk} ATK, +${bonus.hp} HP) • Spent ${need}🔷`);
              this.renderTeamSprites();
              this.updateGachaBtnState?.();
              this.saveState();
            } else if (action === 'heal') {
              const cost = this.healCost(m);
              if (cost <= 0) { this.log(`✅ ${m.name} sudah full HP`); return; }
              const curC = this.getCrystals?.() ?? 0;
              if (curC < cost) { this.log(`❌ Crystals kurang: butuh ${cost}`); return; }
              this.setCrystals?.(curC - cost);
              m.hp = m.maxHp || m.hp;
              this.log(`🩹 Heal ${m.name} • Cost ${cost}💰`);
              this.renderTeamSprites();
              this.saveState();
            } else if (action === 'lock') {
              m.locked = !m.locked;
              this.log(`${m.locked ? '🔒 Locked' : '🔓 Unlocked'} ${m.name}`);
              this.renderTeamSprites();
            } else if (action === 'info') {
              alert(`Nama: ${m.name}\nLv: ${m.level}\nRank: ${m.rank || 1}\nHP: ${m.hp}\nATK: ${m.atk}\nRarity: ${m.rarity}${m.locked ? '\n[Locked]' : ''}`);
            }
            menu.remove();
          });
        });

        // Close menu on click outside
        setTimeout(() => {
          const closeMenu = (ev) => {
            if (!menu.contains(ev.target)) menu.remove();
            document.removeEventListener('mousedown', closeMenu);
          };
          document.addEventListener('mousedown', closeMenu);
          const escHandler = (ev) => { if (ev.key === 'Escape') { menu.remove(); document.removeEventListener('keydown', escHandler); } };
          document.addEventListener('keydown', escHandler);
        }, 0);
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

  showGachaReveal(results = [], spent = 0) {
    if (!Array.isArray(results) || results.length === 0) { this.flashGacha(); return; }
    const overlay = this.add.container(0,0).setDepth(800);
    const bg = this.add.rectangle(360,240,720,480,0x000000,0.78).setAlpha(0).setDepth(801);
    overlay.add(bg);
    this.tweens.add({ targets: bg, alpha: { from: 0, to: 0.78 }, duration: 240, ease: 'Cubic.easeOut' });
    const isMulti = results.length > 1;
    // radial burst base
    const burst = this.add.circle(360,240,10,0xffffff,0.9).setDepth(802).setAlpha(0);
    this.tweens.add({ targets: burst, alpha: { from:0, to:0.7 }, radius: { from:16, to: 180 }, duration: 500, ease:'Quad.easeOut', onComplete: () => burst.destroy() });
    // color swirl particles
    const rarityColors = { common: 0x9aa0b0, rare: 0x3d7dff, epic: 0x914dff, legend: 0xffd947 };
    const totalParticles = 42 + results.length * 12;
    for (let i=0;i<totalParticles;i++) {
      const ang = Math.random()*Math.PI*2;
      const dist = Phaser.Math.Between(10, 140);
      const x = 360 + Math.cos(ang)*dist;
      const y = 240 + Math.sin(ang)*dist;
      this.spawnParticles(x,y,1,{ life: 700, size: Phaser.Math.Between(3,6), speed: 60});
    }
    // Card grid layout
    const cols = isMulti ? Math.min(5, Math.ceil(results.length/2)) : 1;
    const rows = isMulti ? Math.ceil(results.length / cols) : 1;
    const cardW = 110; const cardH = 130; const gap = 18;
    const totalW = cols*cardW + (cols-1)*gap;
    const totalH = rows*cardH + (rows-1)*gap;
    const startX = 360 - totalW/2 + cardW/2;
    const startY = 240 - totalH/2 + cardH/2;
    const cards = [];
    results.forEach((r, idx) => {
      const row = Math.floor(idx/cols);
      const col = idx % cols;
      const cx = startX + col*(cardW+gap);
      const cy = startY + row*(cardH+gap);
      const color = rarityColors[r.rarity] || 0xffffff;
      const card = this.add.container(cx, cy).setDepth(803).setScale(0);
      const rect = this.add.rectangle(0,0, cardW, cardH, 0x08121b, 0.85).setStrokeStyle(3, color, 1);
      const nameTxt = this.add.text(0, -36, r.name, { color:'#ffffff', fontSize:14, fontStyle:'bold', align:'center', wordWrap:{ width: cardW-16 }}).setOrigin(0.5);
      const rarityTxt = this.add.text(0, 4, `${emojiForRarity(r.rarity)} ${r.rarity.toUpperCase()}`, { color:'#ffffff', fontSize:13 }).setOrigin(0.5);
      const levelTxt = this.add.text(0, 34, `Lv ${r.level}${r.rank?` • R${r.rank}`:''}`, { color:'#d9f2ff', fontSize:12 }).setOrigin(0.5);
      card.add([rect, nameTxt, rarityTxt, levelTxt]);
      overlay.add(card);
      cards.push(card);
      // reveal animation stagger
      this.tweens.add({ targets: card, scale: { from:0, to:1.14 }, duration: 320, delay: idx*140, ease:'Back.easeOut' });
      this.tweens.add({ targets: card, y: { from: cy+20, to: cy }, duration: 320, delay: idx*140, ease:'Cubic.easeOut' });
      // rarity sparkle
      const sparkleCount = r.rarity === 'legend' ? 22 : r.rarity === 'epic' ? 14 : r.rarity === 'rare' ? 8 : 4;
      for (let s=0;s<sparkleCount;s++) {
        const sx = cx + Phaser.Math.Between(-cardW/2+8, cardW/2-8);
        const sy = cy + Phaser.Math.Between(-cardH/2+8, cardH/2-8);
        this.spawnParticles(sx, sy, 1, { life: 500 + Phaser.Math.Between(-120,120), size: 3 + (r.rarity==='legend'?1:0), speed: 40 });
      }
      // sound
      const baseFreq = r.rarity === 'legend' ? 880 : r.rarity === 'epic' ? 760 : r.rarity === 'rare' ? 640 : 520;
      this.time.delayedCall(idx*140 + 40, () => this.beep(baseFreq, 90, 'triangle', 0.05));
    });
    // Title + cost
    const title = this.add.text(360, 60, isMulti?`GACHA x${results.length}`:'GACHA', { color:'#ffffff', fontSize: isMulti? 30: 26, fontStyle:'900', align:'center' }).setOrigin(0.5).setDepth(804).setAlpha(0);
    overlay.add(title);
    this.tweens.add({ targets: title, alpha: { from:0, to:1 }, y: { from: 40, to: 60 }, duration: 420, ease:'Cubic.easeOut' });
    const costTxt = this.add.text(360, 420, `Spent ${spent}💰 • Klik / Space untuk tutup`, { color:'#d0eaff', fontSize:14 }).setOrigin(0.5).setDepth(804).setAlpha(0);
    overlay.add(costTxt);
    this.tweens.add({ targets: costTxt, alpha: { from:0, to:1 }, duration: 400, delay: results.length*140, ease:'Cubic.easeOut' });
    const finishDelay = results.length*140 + 800;
    // Auto dismiss after some seconds if user ignores
    const autoTimer = this.time.delayedCall(finishDelay + 6000, () => dismiss());
    const dismiss = () => {
      if (overlay.destroyed) return;
      autoTimer.remove(false);
      window.removeEventListener('keydown', keyHandler);
      this.tweens.add({ targets: overlay.list, alpha: { from:1, to:0 }, duration: 280, ease:'Cubic.easeIn', onComplete: () => overlay.destroy() });
    };
    const keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Escape') {
        dismiss();
      }
    };
    window.addEventListener('keydown', keyHandler);
    bg.setInteractive();
    bg.on('pointerdown', () => dismiss());
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
      // Show Game Over; wait for player to press the button
      this.showGameOver?.(this.wave);
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
