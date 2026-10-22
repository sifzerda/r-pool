// src/lab/applyAppearance.js
// Pushes Lab settings into the shared materials/atlas. Runs on every change,
// mutating objects in place (no React re-render of the 3D scene needed).

import { ballMaterial } from "../renderers/ballAssets";
import { redrawAtlas } from "../renderers/ballTextures";
import * as M from "../renderers/materials";

// Features such as clearcoat/iridescence/sheen are compiled into the shader
// only when > 0, so crossing zero needs a material rebuild.
function setFeature(mat, prop, value) {
  const was = mat[prop] > 0;
  mat[prop] = value;
  if (was !== value > 0) mat.needsUpdate = true;
}

let lastAtlasKey = "";

export function applyAppearance(p) {
  // ── Balls ──────────────────────────────────────────
  ballMaterial.roughness = p["ball.roughness"];
  ballMaterial.metalness = p["ball.metalness"];
  ballMaterial.clearcoatRoughness = p["ball.clearcoatRoughness"];
  ballMaterial.emissiveIntensity = p["ball.glow"];
  setFeature(ballMaterial, "clearcoat", p["ball.clearcoat"]);
  setFeature(ballMaterial, "iridescence", p["ball.iridescence"]);

  const atlasKey = [
    p["ball.saturation"],
    p["ball.brightness"],
    p["ball.stripeWidth"],
    p["ball.badgeSize"],
  ].join("|");

  if (atlasKey !== lastAtlasKey) {
    lastAtlasKey = atlasKey;
    redrawAtlas({
      saturation: p["ball.saturation"],
      brightness: p["ball.brightness"],
      stripeWidth: p["ball.stripeWidth"],
      badgeSize: p["ball.badgeSize"],
    });
  }

  // ── Stick ──────────────────────────────────────────
  const stickRough = p["stick.roughness"];

  M.stickShaftMat.color.set(p["stick.shaft"]);
  M.stickShaftMat.roughness = stickRough;
  M.stickButtMat.color.set(p["stick.butt"]);
  M.stickFerruleMat.color.set(p["stick.ferrule"]);
  M.stickFerruleMat.roughness = Math.min(1, stickRough + 0.05);
  M.stickTipMat.color.set(p["stick.tip"]);

  M.stickAccentMat.color.set(p["stick.accent"]);
  M.stickAccentMat.emissive.set(p["stick.accent"]);
  M.stickAccentMat.emissiveIntensity = p["stick.glow"];
  M.stickAccentMat.metalness = p["stick.accentMetal"];

  // ── Table ──────────────────────────────────────────
  M.feltMat.color.set(p["table.felt"]);
  M.feltMat.roughness = p["table.feltRough"];
  M.feltMat.sheenColor.set(p["table.felt"]).offsetHSL(0, 0, 0.1);
  setFeature(M.feltMat, "sheen", p["table.feltSheen"]);

  M.clothMat.opacity = p["table.cloth"];

  M.railMat.color.set(p["table.rail"]);
  M.railMat.roughness = p["table.railRough"];
  M.railMat.metalness = p["table.railMetal"];

  M.baseMat.color.set(p["table.frame"]);
  M.frameMat.color.set(p["table.frame"]);
  M.wellMat.color.set(p["table.pocket"]);
  M.trimMat.color.set(p["table.trim"]);

  M.diamondMat.color.set(p["table.diamond"]);
  M.diamondMat.emissive.set(p["table.diamond"]);
  M.diamondMat.emissiveIntensity = p["table.diamondGlow"];

  // ── Reflections (older three.js reads envMapIntensity per material) ──
  const refl = p["scene.reflections"];
  ballMaterial.envMapIntensity = refl;
  for (const m of M.labMaterials) m.envMapIntensity = refl;
}
