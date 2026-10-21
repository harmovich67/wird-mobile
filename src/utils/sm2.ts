export const Ratings = {
  FORGOT: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4,
} as const;

export type Rating = typeof Ratings[keyof typeof Ratings];

export interface SM2Result {
  interval: number; // in days
  easeFactor: number;
  repetition: number;
  nextReviewDate: string; // YYYY-MM-DD
  status: 'new' | 'learning' | 'mastered';
}

export function calculateNextReview(
  rating: Rating,
  currentInterval: number = 0,
  currentEase: number = 2.5,
  currentRepetition: number = 0
): SM2Result {
  let ease = currentEase;
  let interval = currentInterval;
  let repetition = currentRepetition;

  if (rating === Ratings.FORGOT) {
    repetition = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    // Increase repetitions
    repetition += 1;

    if (rating === Ratings.HARD) {
      ease = Math.max(1.3, ease - 0.15);
      interval = Math.max(1, Math.round(interval * 1.2));
      if (interval === 0) interval = 1;
    } else if (rating === Ratings.GOOD) {
      if (repetition === 1) {
        interval = 1;
      } else if (repetition === 2) {
        interval = 3;
      } else {
        interval = Math.round(interval * ease);
      }
    } else if (rating === Ratings.EASY) {
      ease = Math.min(3.0, ease + 0.15);
      if (repetition === 1) {
        interval = 4;
      } else if (repetition === 2) {
        interval = 7;
      } else {
        interval = Math.round(interval * ease * 1.3);
      }
    }
  }

  // Cap interval
  interval = Math.min(365, Math.max(1, interval));

  // Determine status
  let status: 'new' | 'learning' | 'mastered' = 'learning';
  if (interval >= 21) {
    status = 'mastered';
  }

  // Next review date
  const now = new Date();
  now.setDate(now.getDate() + interval);
  const nextReviewDate = now.toISOString().split('T')[0];

  return {
    interval,
    easeFactor: Number(ease.toFixed(2)),
    repetition,
    nextReviewDate,
    status,
  };
}

export function formatIntervalPreview(rating: Rating, currentInterval: number, currentEase: number, repetition: number): string {
  const result = calculateNextReview(rating, currentInterval, currentEase, repetition);
  if (result.interval === 1) return 'غداً';
  if (result.interval === 2) return 'بعد يومين';
  if (result.interval <= 10) return `بعد ${result.interval} أيام`;
  return `بعد ${result.interval} يوماً`;
}
