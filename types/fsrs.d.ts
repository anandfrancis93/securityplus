/**
 * Type declarations for the 'fsrs' package
 * FSRS (Free Spaced Repetition Scheduler) - FSRSv4 algorithm
 */

declare module 'fsrs' {
  export enum State {
    New = 0,
    Learning = 1,
    Review = 2,
    Relearning = 3,
  }

  export enum Rating {
    Again = 1,
    Hard = 2,
    Good = 3,
    Easy = 4,
  }

  export interface Card {
    due: Date;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: State;
    last_review: Date;
  }

  export interface ReviewLog {
    rating: Rating;
    state: State;
    due: Date;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    last_elapsed_days: number;
    scheduled_days: number;
    review: Date;
  }

  export interface RecordLog {
    card: Card;
    log: ReviewLog;
  }

  export type DateInput = Date | number | string;

  export interface FSRSParameters {
    request_retention?: number;
    maximum_interval?: number;
    w?: number[];
    enable_fuzz?: boolean;
    enable_short_term?: boolean;
  }

  export interface SchedulingInfo {
    [Rating.Again]: RecordLog;
    [Rating.Hard]: RecordLog;
    [Rating.Good]: RecordLog;
    [Rating.Easy]: RecordLog;
  }

  export class FSRS {
    constructor(params?: FSRSParameters);
    repeat(card: Card, now: DateInput): SchedulingInfo;
    next(card: Card, now: DateInput, grade: Rating): RecordLog;
  }

  export function fsrs(params?: FSRSParameters): FSRS;
  export function generatorParameters(params?: Partial<FSRSParameters>): FSRSParameters;
  export function createEmptyCard(now?: DateInput): Card;
}
