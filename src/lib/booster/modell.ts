/**
 * Booster-Aufbau je Pokémon-TCG-Serie: welche „Ströme“ (feste Slots oder
 * Hit-Slots) ein Booster hat und aus welchem Seltenheits-Pool jeder zieht.
 *
 * Grundlage sind die über Case-Openings dokumentierten Pull-Rates. Innerhalb
 * einer Seltenheit wird Gleichverteilung angenommen; die Rates sind Mittelwerte
 * über die Sets einer Serie, nicht set-genau.
 */

export interface BoosterStrom {
  /** Seltenheits-Schlüssel (Rarity.de), aus deren gemeinsamem Pool gezogen wird. */
  raritaeten: readonly string[];
  /**
   * Erwartete Karten dieses Stroms pro Booster.
   * Ganzzahlig ≥ 1 = feste Slots (Ziehung ohne Zurücklegen).
   * Bruch < 1 = Trefferwahrscheinlichkeit („1 von N Boostern“).
   */
  proBooster: number;
}

export interface BoosterModell {
  slots: readonly BoosterStrom[];
}

const HAEUFIG = 'häufig';
const UNGEWOEHNLICH = 'nicht so häufig';
const SELTEN = 'selten';

/** Karmesin & Purpur: 10-Karten-Booster mit garantiertem Reverse-Holo und Holo-Slot. */
const KARMESIN_PURPUR: BoosterModell = {
  slots: [
    { raritaeten: [HAEUFIG], proBooster: 4 },
    { raritaeten: [UNGEWOEHNLICH], proBooster: 3 },
    { raritaeten: [HAEUFIG, UNGEWOEHNLICH, SELTEN], proBooster: 1 }, // Reverse Holo
    { raritaeten: [SELTEN], proBooster: 0.65 }, // Holo-/„selten“-Slot …
    { raritaeten: ['doppelselten'], proBooster: 0.35 }, // … oder Double Rare (ex)
    { raritaeten: ['selten, Illustration'], proBooster: 1 / 12 },
    { raritaeten: ['ultraselten'], proBooster: 1 / 13 },
    { raritaeten: ['selten, ASS-KLASSE'], proBooster: 1 / 20 },
    { raritaeten: ['selten, Schillernd'], proBooster: 1 / 25 },
    { raritaeten: ['selten, besondere Illustration'], proBooster: 1 / 60 },
    { raritaeten: ['selten, Schwarz Weiß'], proBooster: 1 / 60 },
    { raritaeten: ['ultraselten, Schillernd'], proBooster: 1 / 130 },
    { raritaeten: ['hyperselten'], proBooster: 1 / 100 }
  ]
};

/** Mega-Entwicklung: wie Karmesin & Purpur, aber deutlich hit-dichter. */
const MEGA_ENTWICKLUNG: BoosterModell = {
  slots: [
    { raritaeten: [HAEUFIG], proBooster: 4 },
    { raritaeten: [UNGEWOEHNLICH], proBooster: 3 },
    { raritaeten: [HAEUFIG, UNGEWOEHNLICH, SELTEN], proBooster: 1 },
    { raritaeten: [SELTEN], proBooster: 0.6 },
    { raritaeten: ['doppelselten'], proBooster: 0.4 },
    { raritaeten: ['selten, Illustration'], proBooster: 1 / 11 },
    { raritaeten: ['ultraselten'], proBooster: 1 / 9 },
    { raritaeten: ['selten, besondere Illustration'], proBooster: 1 / 45 },
    { raritaeten: ['hyperselten, Mega'], proBooster: 1 / 120 }
  ]
};

/**
 * Schwert & Schild: 10-Karten-Booster. Die Seltenheiten dieser Serie sind im
 * Datensatz gröber – „besonders selten“ bündelt V/VMAX/VSTAR, Radiant, Amazing
 * und alle versteckten Seltenen (Rainbow/Gold/Secret).
 */
const SCHWERT_SCHILD: BoosterModell = {
  slots: [
    { raritaeten: [HAEUFIG], proBooster: 4 },
    { raritaeten: [UNGEWOEHNLICH], proBooster: 3 },
    { raritaeten: [HAEUFIG, UNGEWOEHNLICH, SELTEN], proBooster: 1 }, // Reverse Holo
    { raritaeten: [SELTEN], proBooster: 1 }, // „selten“-Slot (Holo oder nicht)
    { raritaeten: ['besonders selten'], proBooster: 1 / 3 },
    { raritaeten: ['ultraselten'], proBooster: 1 / 10 }
  ]
};

const NACH_SERIE: Record<string, BoosterModell> = {
  'Karmesin & Purpur': KARMESIN_PURPUR,
  'Mega-Entwicklung': MEGA_ENTWICKLUNG,
  'Schwert & Schild': SCHWERT_SCHILD
};

/** Booster-Modell einer Serie; fällt bei unbekannter Serie auf Karmesin & Purpur zurück. */
export function boosterModell(serie: string): BoosterModell {
  return NACH_SERIE[serie] ?? KARMESIN_PURPUR;
}
