//src/renderers/BallRenderer.jsx

import Ball from "./Ball";
import { ballTextures } from "./ballTextures";

export default function BallRenderer({
  balls,
}) {
  return (
    <>
      {balls.map(ball => (
        <Ball
          key={ball.id}
          ball={ball}
          texture={
            ballTextures.get(ball.id)
          }
        />
      ))}
    </>
  );
}