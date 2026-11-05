// src/__tests__/eightBall.test.js

// tests winning and losing 

import useGameStore, { SCREENS } from "../store/useGameStore.js";

describe("8-Ball Game Rules", () => {
  beforeEach(() => {
    const store = useGameStore.getState();

    store.setSetting("solo", false);
    store.startGame({ startingPlayer: "human" });

    useGameStore.setState({
      playerGroups: {
        human: "solids",
        ai: "stripes",
      },
    });
  });

  test("legally potting the 8-ball wins the game", () => {
    const store = useGameStore.getState();

    // All seven solids have already been potted.
    useGameStore.setState({
      pottedIds: new Set([1, 2, 3, 4, 5, 6, 7]),
    });

    store.recordShot();
    store.recordFirstContact(8);
    store.markPotted(8);
    store.finishShot();

    const state = useGameStore.getState();

    expect(state.winner).toBe("human");
    expect(state.screen).toBe(SCREENS.COMPLETE);
    expect(state.stats.cleared).toBe(true);
    expect(state.foul).toBeNull();
  });

  test("potting the 8-ball early loses the game", () => {
    const store = useGameStore.getState();

    store.recordShot();
    store.recordFirstContact(8);
    store.markPotted(8);
    store.finishShot();

    const state = useGameStore.getState();

    expect(state.winner).toBe("ai");
    expect(state.screen).toBe(SCREENS.COMPLETE);
    expect(state.foul).toBe("Early 8-ball contact");
    expect(state.stats.cleared).toBe(true);
  });

  test("scratching while potting the 8-ball loses the game", () => {
    const store = useGameStore.getState();

    // Make the 8-ball otherwise legal.
    useGameStore.setState({
      pottedIds: new Set([1, 2, 3, 4, 5, 6, 7]),
    });

    store.recordShot();
    store.recordFirstContact(8);
    store.markPotted(8);
    store.recordScratch();
    store.finishShot();

    const state = useGameStore.getState();

    expect(state.winner).toBe("ai");
    expect(state.screen).toBe(SCREENS.COMPLETE);
    expect(state.foul).toBe("Scratch");
    expect(state.stats.scratches).toBe(1);
  });
});
