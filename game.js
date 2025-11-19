/* Phaser Autobattler Prototype (updated)
  - Gacha with rarity
  - Dupe -> level up (merge)
  - Auto-battle vs Dollar Kuning
  - Simple phaser animations & particles implemented via tweens (no createEmitter)
*/

/* ---------- CONFIG / DATA ---------- */

const YOUTUBER_POOL = [
  { name: "Windah", atk: 6, hp: 24, rarity: "rare" },
  { name: "MiawAug", atk: 5, hp: 26, rarity: "common" },
  { name: "TaraArts", atk: 7, hp: 20, rarity: "epic" },
  { name: "JessNoLimit", atk: 8, hp: 18, rarity: "legend" },
  { name: "FrostDiamond", atk: 5, hp: 28, rarity: "common" },
  { name: "PewPew", atk: 6, hp: 22, rarity: "rare" },
];

const RATES = {
  common: 0.62,
  rare: 0.25,
  epic: 0.1,
  legend: 0.03,
};

const BUFF = {
  atkPerLevel: 2,
  hpPerLevel: 6,
};

const ENEMY_BASE = { name: "Dollar Kuning", hp: 50, atk: 6 };

// Gacha costs (basic economy)
const GACHA_COST = { 1: 160, 10: 1600 };

function pickRarity() {
  const r = Math.random();
  let acc = 0;
  for (const [k, v] of Object.entries(RATES)) {
    acc += v;
    if (r <= acc) return k;
  }
  return "common";
}

function pickByRarity(rarity) {
  const pool = YOUTUBER_POOL.filter((x) => x.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ---------- GAME STATE ---------- */
let team = [];
let nextId = 1;

/* ---------- PHASER SCENE ---------- */

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    // no external assets required
  }

  create() {
    // background
    this.add.rectangle(360, 240, 720, 480, 0x08121b);

    // enemy container
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

    // team display
    this.teamDisplay = this.add.container(360, 360);

    // little white dot texture (for optional sprite use) - not required but fine to have
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 2, 2);
    g.generateTexture("dot", 2, 2);

    // tutorial text
    this.tips = this.add.text(
      12,
      12,
      "Tip: Gacha -> Build team -> Battle\nDupe = level up (merge)",
      {
        color: "#cfeaff",
        fontSize: 14,
      }
    );

    // HTML UI hooks
    this.setupHtmlHooks();

    // initial render & enemy
    this.renderTeamSprites();
    this.setEnemy(ENEMY_BASE);
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

    const getCrystals = () => Number(this.crystalsEl?.innerText || 0) || 0;
    const setCrystals = (val) => {
      if (this.crystalsEl) this.crystalsEl.innerText = String(val);
    };
    const canAfford = (count) => getCrystals() >= (count === 10 ? GACHA_COST[10] : GACHA_COST[1]);
    const spend = (count) => {
      const cost = count === 10 ? GACHA_COST[10] : GACHA_COST[1];
      setCrystals(Math.max(0, getCrystals() - cost));
      return cost;
    };
    const updateGachaBtnState = () => {
      const count = Number(this.pullCount.value);
      const affordable = canAfford(count);
      this.gachaBtn.disabled = !affordable;
      this.gachaBtn.setAttribute("aria-pressed", String(affordable));
    };

    this.gachaBtn.onclick = () => {
      const count = Number(this.pullCount.value);
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
      this.lastPull.innerText = `Last: ${emojiForRarity(last.rarity)} ${
        last.name
      } (Lv ${last.level}) — Spent ${spent}`;
      this.log(
        `🎰 Gacha: ${results
          .map((r) => `${emojiForRarity(r.rarity)} ${r.name} (Lv ${r.level})`)
          .join(", ")} • Cost ${spent}`
      );
      this.renderTeamSprites();
      this.flashGacha();
      updateGachaBtnState();
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
    };

    this.pullCount.onchange = updateGachaBtnState;
    updateGachaBtnState();
  }

  setEnemy(base) {
    const scale = Math.max(1, 1 + team.length * 0.15);
    this.enemy = {
      name: base.name,
      hp: Math.round(base.hp * scale),
      atk: Math.round(base.atk * scale),
    };
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
    const rarity = pickRarity();
    const charSample = pickByRarity(rarity);
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
        .text(0, -36, `${member.name}`, {
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
          <button class="btn-secondary" data-id="${
            m.id
          }" style="font-size:12px;padding:6px 8px">⚡+</button>
        </div>
      `;
      this.teamListEl.appendChild(div);

      // attach level-up (manual) button — for quick testing
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

    // simple sparkle spawn across top area
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
    this.setEnemy(ENEMY_BASE);
    this.log(
      `⚔️ Battle start! Musuh: ${this.enemy.name} (HP ${this.enemy.hp})`
    );

    await this.tweenAsync(this.enemyContainer, { y: 140 }, 150, "Back.easeOut");
    await this.tweenAsync(
      this.enemyContainer,
      { y: 120 },
      150,
      "Cubic.easeOut"
    );

    let round = 1;
    while (this.enemy.hp > 0 && team.length > 0) {
      this.log(`--- Round ${round} ---`);
      for (const member of [...team]) {
        this.punchTeamMember(member);
        await this.delay(220);

        this.enemy.hp -= member.atk;
        this.enemy.hp = Math.max(0, this.enemy.hp);
        this.updateEnemyUI();
        // spawn small hit particles at enemy
        this.spawnParticles(
          360 + Phaser.Math.Between(-40, 40),
          120 + Phaser.Math.Between(-20, 20),
          8
        );
        this.log(
          `${member.name} deals ${member.atk} dmg -> Enemy HP ${Math.max(
            0,
            this.enemy.hp
          )}`
        );

        if (this.enemy.hp <= 0) break;
      }

      if (this.enemy.hp <= 0) break;

      const targetIdx = Phaser.Math.Between(0, team.length - 1);
      const target = team[targetIdx];

      await this.enemyStrike(targetIdx);

      target.hp -= this.enemy.atk;
      this.log(
        `${this.enemy.name} hits ${target.name} for ${
          this.enemy.atk
        } -> ${Math.max(0, target.hp)} HP`
      );

      // spawn hit particles on team card
      const cardBaseX = 360 - ((team.length - 1) * 140) / 2 + targetIdx * 140;
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
      // victory burst
      for (let i = 0; i < 45; i++) {
        const ang = Phaser.Math.Between(0, 360);
        const dist = Phaser.Math.Between(10, 200);
        const x = 360 + Math.cos(Phaser.Math.DegToRad(ang)) * dist;
        const y = 120 + Math.sin(Phaser.Math.DegToRad(ang)) * dist;
        this.spawnParticles(x, y, 1, { life: 900, size: 5, speed: 260 });
      }
    } else {
      this.log(`💀 Defeat... Your team was wiped.`);
    }

    this.updateEnemyUI();
    this.renderTeamSprites();
  }

  // small particle emulator using circles + tweens (replacement for createEmitter)
  spawnParticles(x, y, qty = 6, opts = { life: 500, size: 3, speed: 120 }) {
    for (let i = 0; i < qty; i++) {
      const px = x;
      const py = y;
      const size = opts.size || 3;
      const col = 0xffffff;
      const p = this.add.circle(px, py, size, col).setDepth(60).setAlpha(1);
      const vx = Phaser.Math.Between(-opts.speed, opts.speed);
      const vy =
        Phaser.Math.Between(-opts.speed / 2, -opts.speed / 8) -
        Phaser.Math.Between(0, opts.speed / 2);
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
  }

  enemyStrike(targetIdx) {
    return this.tweenAsync(
      this.enemyContainer,
      { x: 360 + Phaser.Math.Between(-8, 8) },
      140,
      "Quad.easeInOut"
    )
      .then(() =>
        this.tweenAsync(this.enemyContainer, { x: 360 }, 120, "Quad.easeInOut")
      )
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

  log(msg) {
    const el = this.battleLogEl;
    const stamp = new Date().toLocaleTimeString();
    el.innerText =
      (el.innerText === "—" ? "" : el.innerText + "\n") + `[${stamp}] ${msg}`;
    el.scrollTop = el.scrollHeight;
    console.log(msg);
  }
}

/* visuals helpers */
function colorForRarity(r) {
  switch (r) {
    case "common":
      return 0x7f8c8d;
    case "rare":
      return 0x66c2ff;
    case "epic":
      return 0xb266ff;
    case "legend":
      return 0xffcb3b;
    default:
      return 0x6b7280;
  }
}
function emojiForRarity(r) {
  switch (r) {
    case "common":
      return "🔹";
    case "rare":
      return "🔷";
    case "epic":
      return "🔮";
    case "legend":
      return "✨";
    default:
      return "🔹";
  }
}

/* ---------- PHASER CONFIG ---------- */

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 720,
  height: 480,
  backgroundColor: "#071018",
  scene: [MainScene],
};

const game = new Phaser.Game(config);
