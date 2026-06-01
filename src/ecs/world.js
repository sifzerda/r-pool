// ─── Miniplex-style ECS (lightweight inline implementation) ───────────────────
export class World {
  constructor() {
    this.entities = [];
    this._nextId = 1;
  }

  createEntity(components = {}) {
    const entity = {
      id: this._nextId++,
      ...components,
    };

    this.entities.push(entity);
    return entity;
  }

  destroyEntity(entity) {
    const idx = this.entities.indexOf(entity);

    if (idx !== -1) {
      this.entities.splice(idx, 1);
    }
  }

  query(...keys) {
    return this.entities.filter(entity =>
      keys.every(key => key in entity)
    );
  }

  clear() {
    this.entities = [];
    this._nextId = 1;
  }
}