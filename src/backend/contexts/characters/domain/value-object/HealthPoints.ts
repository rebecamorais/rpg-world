import { CharacterError, CharacterErrorCodes } from '../CharacterError';

export class HealthPoints {
  private _current: number;
  private _max: number;

  constructor(current: number, max: number) {
    if (max < 1) throw new CharacterError(CharacterErrorCodes.DOMAIN_HP_MAX_BELOW_ONE);
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
    if (amount < 0) throw new CharacterError(CharacterErrorCodes.DOMAIN_HP_DAMAGE_NEGATIVE);
    const newCurrent = Math.max(0, this._current - amount);
    return new HealthPoints(newCurrent, this._max);
  }

  heal(amount: number): HealthPoints {
    if (amount < 0) throw new CharacterError(CharacterErrorCodes.DOMAIN_HP_HEALING_NEGATIVE);
    const newCurrent = Math.min(this._max, this._current + amount);
    return new HealthPoints(newCurrent, this._max);
  }

  get status() {
    return { current: this._current, max: this._max };
  }
}
