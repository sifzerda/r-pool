// src/__tests__/gameRules.test.js

// tests legal rules for turns and potting, fouls, scratches, and ball-in-hand

import useGameStore from "../store/useGameStore.js";

describe("Pool Game Rules", () => {
  beforeEach(() => {
    const store = useGameStore.getState();

    store.setSetting("solo", false);
    store.startGame({ startingPlayer: "human" });

    // Assign groups for tests involving solids and stripes.
    useGameStore.setState({
      playerGroups: {
        human: "solids",
        ai: "stripes",
      },
    });
  });

  test("missed shot switches to opponent", () => {
    const store = useGameStore.getState();

    store.recordShot();
    store.recordFirstContact(1);
    store.recordRailContact();
    store.finishShot();

    const state = useGameStore.getState();

    expect(state.currentPlayer).toBe("ai");
    expect(state.ballInHand).toBe(false);
    expect(state.foul).toBeNull();
    expect(state.stats.shotActive).toBe(false);
  });

  test("potting only opponent's ball causes a foul", () => {
    const store = useGameStore.getState();

    store.recordShot();

    // Legal first contact with own group.
    store.recordFirstContact(1);

    // But only an opponent's ball is potted.
    store.markPotted(9);

    store.finishShot();

    const state = useGameStore.getState();

    expect(state.foul).toBe(
      "Only opponent's balls potted"
    );
    expect(state.currentPlayer).toBe("ai");
    expect(state.ballInHand).toBe(true);
    expect(state.pottedIds.has(9)).toBe(true);
  });

  test("scratching gives opponent ball-in-hand", () => {
    const store = useGameStore.getState();

    store.recordShot();
    store.recordFirstContact(1);
    store.recordScratch();
    store.finishShot();

    const state = useGameStore.getState();

    expect(state.foul).toBe("Scratch");
    expect(state.currentPlayer).toBe("ai");
    expect(state.ballInHand).toBe(true);
    expect(state.stats.scratches).toBe(1);
    expect(state.stats.shotActive).toBe(false);
  });
});
