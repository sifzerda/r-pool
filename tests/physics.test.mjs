import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { world, ballQuery,activeBalls,fallingBalls,clearWorld,activeBall,ballsAreMoving,canAim } from '../src/ecs/world.js';
import { setupGame } from '../src/ecs/setupGame.js';
import { PhysicsEngine,shotSystem,collisionSystem,resolveCushions,detectPockets,updateFallingBalls,respawnCueBall } from '../src/ecs/PhysicsEngine.js';
import { BALL_R,BALL_Y,MAX_POWER,MAX_SHOT_SPEED,PLAY_X,PLAY_Z } from '../src/ecs/constants/table.js';
import { MIN_X,MAX_X,MIN_Z,MAX_Z } from '../src/ecs/constants/tableBounds.js';
import { resetPhysics,setPhysics,physicsConfig } from '../src/ecs/constants/physicsConfig.js';
import { POCKETS,FALL_END_Y } from '../src/ecs/constants/pockets.js';
import {resetPotted,getStats,markPotted,recordShot,finishShot,subscribe} from '../src/store/pottedStore.js';
import * as legacy from '../src/ecs/store/pottedStore.js';
import * as THREE from 'three';
import {makeFeltGeometry,makeClothGeometry,makeFrameGeometry,makeLinerGeometry} from '../src/renderers/tableGeometry.js';

const aim=()=>({current:{pendingShot:null,swing:0,swingT:0}});
function ball(patch={}) {return world.add({ball:true,id:1,instanceId:1,x:0,y:BALL_Y,z:0,vx:0,vz:0,rotX:0,rotY:0,rotZ:0,radius:BALL_R,active:false,sleeping:true,pocketed:false,falling:false,scratched:false,fallSpeed:0,...patch});}
const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const energy=()=>ballQuery.entities.reduce((sum,b)=>sum+b.vx*b.vx+b.vz*b.vz,0);
beforeEach(()=>{clearWorld();resetPotted();resetPhysics();});

test('rack resets to sixteen unique balls and eight ball stays in centre row',()=>{
 const cue=setupGame();assert.equal(ballQuery.entities.length,16);assert.equal(new Set(ballQuery.entities.map(b=>b.id)).size,16);assert.equal(new Set(ballQuery.entities.map(b=>b.instanceId)).size,16);assert.equal(cue.id,0);
 const eight=ballQuery.entities.find(b=>b.id===8);close(eight.z,0);assert.ok(eight.x>.9);setupGame();assert.equal(ballQuery.entities.length,16);assert.equal(activeBalls.size,0);
});
test('potted store aliases are one singleton and ignore duplicate pots',()=>{assert.equal(legacy.markPotted,markPotted);let calls=0;const stop=subscribe(()=>calls++);markPotted(1);markPotted(1);markPotted(0);stop();assert.equal(calls,1);assert.equal(getStats().potted,1);});
test('shot is consumed once, normalized and counted once',()=>{const cue=ball({cueBall:true,id:0}),a=aim();a.current.pendingShot={cos:4,sin:0,power:MAX_POWER};assert.equal(shotSystem(cue,a),true);close(cue.vx,MAX_SHOT_SPEED);assert.equal(a.current.pendingShot,null);assert.equal(shotSystem(cue,a),false);assert.equal(getStats().shots,1);});
test('invalid shot requests never produce motion or statistics',()=>{const cue=ball({cueBall:true,id:0}),a=aim();for(const shot of [{cos:0,sin:0,power:1},{cos:NaN,sin:0,power:1},{cos:1,sin:0,power:Infinity},{cos:1,sin:0,power:0}]){a.current.pendingShot=shot;assert.equal(shotSystem(cue,a),false);}assert.equal(getStats().shots,0);assert.equal(activeBalls.size,0);});
test('cannot fire while another ball moves or cue is unavailable',()=>{const cue=ball({cueBall:true,id:0}),other=ball({x:1}),a=aim();activeBall(other);a.current.pendingShot={cos:1,sin:0,power:1};assert.equal(shotSystem(cue,a),false);assert.equal(canAim(cue,a.current),false);});
test('equal-mass head-on collision conserves momentum and does not add energy',()=>{const a=ball({x:0,vx:2}),b=ball({x:.19});activeBall(a);const before=energy();collisionSystem();close(a.vx+b.vx,2);assert.ok(energy()<=before+1e-8);assert.ok(b.vx>1.9);assert.equal(b.active,true);});
test('separating balls get overlap correction without a second impulse',()=>{const a=ball({x:0,vx:-1}),b=ball({x:.19,vx:1});activeBall(a);activeBall(b);collisionSystem();close(a.vx,-1);close(b.vx,1);close(b.x-a.x,.2);});
test('coincident balls separate without NaN',()=>{const a=ball({vx:1}),b=ball();activeBall(a);collisionSystem();assert.ok(Number.isFinite(a.vx+b.vx+a.x+b.x));close(Math.hypot(b.x-a.x,b.z-a.z),.2);});
test('cushion normal and tangent energy do not increase',()=>{const b=ball({x:MAX_X+.1,z:0,vx:3,vz:2});const before=energy();resolveCushions(b);close(b.x,MAX_X);assert.ok(b.vx<0);assert.ok(energy()<=before);});
test('each pocket captures at its centre before reflecting on a cushion',()=>{for(const p of POCKETS){const b=ball({id:p.id+1,x:p.x,z:p.z,vx:1});activeBall(b);resolveCushions(b);detectPockets();assert.equal(b.falling,true);assert.equal(b.active,false);}assert.equal(getStats().potted,6);});
test('falling objects reach pocket floor and stop simulating',()=>{const p=POCKETS[1],b=ball({x:p.x,z:p.z,vx:1});activeBall(b);detectPockets();for(let i=0;i<500;i++)updateFallingBalls(1/120);assert.equal(b.pocketed,true);assert.equal(b.falling,false);close(b.y,FALL_END_Y);assert.equal(fallingBalls.size,0);});
test('scratched cue waits for the other balls and finds a free respawn',()=>{const p=POCKETS[0],cue=ball({id:0,cueBall:true,x:p.x,z:p.z,vx:1}),obstacle=ball({x:0,z:0,vx:1});activeBall(cue);activeBall(obstacle);detectPockets();assert.equal(cue.scratched,true);assert.equal(respawnCueBall(cue),false);assert.equal(getStats().scratches,1);activeBalls.delete(obstacle);obstacle.active=false;assert.equal(respawnCueBall(cue),true);assert.ok(Math.hypot(cue.x-obstacle.x,cue.z-obstacle.z)>=BALL_R*2);assert.equal(cue.pocketed,false);});
test('scratch without other moving balls recovers through the engine',()=>{const cue=ball({id:0,cueBall:true,scratched:true,pocketed:true}),engine=new PhysicsEngine(cue,aim());engine.update(1/60);assert.equal(cue.scratched,false);});
test('multi-pot feedback and table-clear feedback update only on events',()=>{recordShot();markPotted(1);markPotted(2);finishShot();assert.equal(getStats().lastPots,2);assert.equal(getStats().bestPots,2);assert.match(getStats().message,/2 balls/);recordShot();for(let id=3;id<=15;id++)markPotted(id);finishShot();assert.equal(getStats().cleared,true);});
test('invalid live physics values cannot inject NaN or gain restitution above one',()=>{setPhysics({ballE:20,rollDecel:-2,viscous:NaN});assert.equal(physicsConfig.ballE,1);assert.equal(physicsConfig.rollDecel,0);assert.equal(physicsConfig.viscous,.25);});
function simulate(hz,seconds=4){clearWorld();resetPotted();const cue=ball({id:0,cueBall:true,x:-1,z:.4}),a=aim();a.current.pendingShot={cos:1,sin:.2,power:MAX_POWER*.35};const engine=new PhysicsEngine(cue,a);for(let i=0;i<hz*seconds;i++)engine.update(1/hz);return [cue.x,cue.z,cue.vx,cue.vz];}
test('same shot at 30, 60, and 144 Hz produces equivalent fixed-step results',()=>{const expected=simulate(60);for(const hz of [30,144])simulate(hz).forEach((value,i)=>close(value,expected[i],1e-7));});
test('large frame deltas are clamped and invalid deltas cannot advance time',()=>{const cue=ball({id:0,cueBall:true}),a=aim(),engine=new PhysicsEngine(cue,a);a.current.pendingShot={cos:1,sin:0,power:MAX_POWER};engine.update(NaN);close(cue.x,0);engine.update(10);assert.ok(cue.x<=MAX_SHOT_SPEED*.05+1e-9);});
test('a settled shot stops requesting frames after its trailing frame',()=>{const cue=ball({id:0,cueBall:true}),a=aim(),engine=new PhysicsEngine(cue,a);a.current.pendingShot={cos:1,sin:0,power:.1};for(let i=0;i<3000&&engine.update(1/60);i++);assert.equal(ballsAreMoving(),false);assert.equal(engine.update(1/60),false);assert.equal(getStats().shotActive,false);});
test('full-power break settles with finite in-bounds or potted balls',()=>{const cue=setupGame(),a=aim(),engine=new PhysicsEngine(cue,a);a.current.pendingShot={cos:1,sin:0,power:MAX_POWER};let frames=0;while(engine.update(1/60)&&frames++<6000);assert.ok(frames<6000);assert.equal(ballQuery.entities.length,16);for(const b of ballQuery.entities){assert.ok([b.x,b.y,b.z,b.vx,b.vz].every(Number.isFinite));if(!b.pocketed&&!b.falling){assert.ok(b.x>=MIN_X-1e-7&&b.x<=MAX_X+1e-7);assert.ok(b.z>=MIN_Z-1e-7&&b.z<=MAX_Z+1e-7);}}});
test('pocket-hole geometries contain finite positions and retain real open cloth holes',()=>{
 for(const make of [makeFeltGeometry,makeClothGeometry,makeFrameGeometry,makeLinerGeometry]){const g=make();assert.ok(g.attributes.position.count>0);for(const value of g.attributes.position.array)assert.ok(Number.isFinite(value));g.dispose();}
 const cloth=makeClothGeometry(),mesh=new THREE.Mesh(cloth,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();const ray=new THREE.Raycaster(new THREE.Vector3(0,2,0),new THREE.Vector3(0,-1,0));assert.ok(ray.intersectObject(mesh).length>0);
 for(const p of POCKETS){ray.ray.origin.set(p.x,2,p.z);assert.equal(ray.intersectObject(mesh).length,0);}
 cloth.dispose();mesh.material.dispose();
});
test('forty slightly different full-power breaks settle without invalid state',()=>{
 for(let shot=0;shot<40;shot++){
  const cue=setupGame(),a=aim(),angle=(shot-20)*.012;
  a.current.pendingShot={cos:Math.cos(angle),sin:Math.sin(angle),power:MAX_POWER};
  const engine=new PhysicsEngine(cue,a);let frames=0;
  while(engine.update(1/60)&&frames++<6000);
  assert.ok(frames<6000);
  const remaining=ballQuery.entities.filter(b=>!b.pocketed&&!b.falling);
  for(const b of ballQuery.entities)assert.ok([b.x,b.y,b.z,b.vx,b.vz].every(Number.isFinite));
  for(let i=0;i<remaining.length;i++)for(let j=i+1;j<remaining.length;j++)assert.ok(Math.hypot(remaining[i].x-remaining[j].x,remaining[i].z-remaining[j].z)>.199);
 }
});
