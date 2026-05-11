export class GameEvents {
    /** Payload: { money: number } */
    static readonly MONEY_CHANGED = "MONEY_CHANGED";
    /** Payload: { seconds: number } */
    static readonly TIMER_CHANGED = "TIMER_CHANGED";
    /** Payload: { cardId: string } */
    static readonly CARD_SELECTED = "CARD_SELECTED";
    /** Payload: { victory: boolean } */
    static readonly GAME_FINISHED = "GAME_FINISHED";
}
