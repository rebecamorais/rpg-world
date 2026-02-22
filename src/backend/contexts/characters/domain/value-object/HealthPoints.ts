export class HealthPoints {
    private _current: number;
    private _max: number;

    constructor(current: number, max: number) {
        if (max < 1) throw new Error("A vida máxima deve ser pelo menos 1");
        this._max = max;
        this._current = Math.min(Math.max(0, current), max);
    }

    get current(): number {
        return this._current;
    }

    get max(): number {
        return this._max;
    }

    takeDamage(amount: number): HealthPoints {
        if (amount < 0) throw new Error("Dano não pode ser negativo");
        const newCurrent = Math.max(0, this._current - amount);
        return new HealthPoints(newCurrent, this._max);
    }

    heal(amount: number): HealthPoints {
        if (amount < 0) throw new Error("Cura não pode ser negativa");
        const newCurrent = Math.min(this._max, this._current + amount);
        return new HealthPoints(newCurrent, this._max);
    }

    get status() {
        return { current: this._current, max: this._max };
    }
}
