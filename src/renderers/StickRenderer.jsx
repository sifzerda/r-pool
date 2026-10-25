// src/renderers/StickRenderer.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { canAim } from "../ecs/world.js";
import { BALL_Y, MAX_POWER, CUE_REST_DISTANCE, CUE_FOLLOW_DISTANCE } from "../ecs/constants/table.js";
import { stickTipMat, stickFerruleMat, stickShaftMat, stickAccentMat, stickButtMat } from "./materials.js";

const CUE_RENDER_Y = 0.58;

function cylinder(top, bottom, length, segments, x) {
  const geometry = new THREE.CylinderGeometry(top, bottom, length, segments);
  geometry.rotateZ(Math.PI / 2);
  geometry.translate(x, 0, 0);
  return geometry;
}

function merge(parts) {
  const geometry = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  return geometry;
}

const tip = cylinder(0.018, 0.028, 0.14, 12, 0.07);
const ferrule = cylinder(0.028, 0.032, 0.18, 12, 0.23);
const shaft = merge([cylinder(0.032, 0.052, 2.2, 16, 1.42), cylinder(0.06, 0.07, 0.82, 16, 3.65)]);
const rings = merge([cylinder(0.056, 0.056, 0.024, 12, 2.53), cylinder(0.056, 0.056, 0.016, 12, 2.566), cylinder(0.062, 0.062, 0.024, 12, 3.21), cylinder(0.062, 0.062, 0.016, 12, 3.246)]);
const dark = merge([cylinder(0.056, 0.06, 0.64, 14, 2.88), cylinder(0.07, 0.07, 0.072, 12, 4.1)]);

const backgroundMat = new THREE.MeshBasicMaterial({ color: "#151515" });
const fillMat = new THREE.MeshBasicMaterial({ color: "#00e5ff" });
const backgroundGeo = new THREE.BoxGeometry(0.82, 0.035, 0.035);
const fillGeo = new THREE.BoxGeometry(0.8, 0.025, 0.025);

function StickRenderer({ cueBall, aimRef }) {
  const stick = useRef(), meter = useRef(), fill = useRef();
  
  useFrame(() => {
    if (!stick.current || !meter.current || !fill.current) return;
    const aim = aimRef.current, following = aim.swing === 2, ready = canAim(cueBall, aim);
    stick.current.visible = ready || following;
    meter.current.visible = ready && aim.charging;
    if (!stick.current.visible) return;
    const locked = aim.charging || following;
    const angle = locked ? aim.lockedAngle : aim.angle, cos = locked ? aim.lockedCos : aim.cos, sin = locked ? aim.lockedSin : aim.sin;
    let distance = CUE_REST_DISTANCE + (aim.charging ? aim.pullBack : 0);
    if (following) {
      const t = THREE.MathUtils.clamp(aim.swingT, 0, 1), start = CUE_REST_DISTANCE + aim.shotPullBack;
      distance = start + (-CUE_FOLLOW_DISTANCE - start) * (1 - (1 - t) ** 3);
    }
    stick.current.position.set((following ? aim.shotX : cueBall.x) - cos * distance, CUE_RENDER_Y, (following ? aim.shotZ : cueBall.z) - sin * distance);
    stick.current.rotation.set(0, -angle + Math.PI, 0);
    meter.current.position.set(cueBall.x, BALL_Y + 0.3, cueBall.z - 0.55);
    const ratio = THREE.MathUtils.clamp(aim.power / MAX_POWER, 0, 1);
    fill.current.scale.x = Math.max(1e-3, ratio);
    fill.current.position.x = -0.4 + ratio * 0.4;
  });

  return <>
    <group ref={stick} visible={false} dispose={null}>
      <mesh geometry={tip} material={stickTipMat} castShadow /><mesh geometry={ferrule} material={stickFerruleMat} castShadow />
      <mesh geometry={shaft} material={stickShaftMat} castShadow /><mesh geometry={rings} material={stickAccentMat} castShadow /><mesh geometry={dark} material={stickButtMat} castShadow />
    </group>
    <group ref={meter} visible={false} dispose={null}><mesh geometry={backgroundGeo} material={backgroundMat} /><mesh ref={fill} geometry={fillGeo} position={[-0.4, 0.022, 0]} material={fillMat} /></group>
  </>;
}

export {
  StickRenderer as default
};
