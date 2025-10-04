export class RatingSystem {
  static K_FACTOR = 32; // legacy (未使用)
  static WIN_GAIN = 20;  // 勝利 +20
  static LOSS_PENALTY = -15; // 敗北 -15
  
  static calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }
  
  static updateRatings(winnerRating: number, loserRating: number) {
    const winnerChange = this.WIN_GAIN;
    const loserChange = this.LOSS_PENALTY;
    return {
      winnerRating: winnerRating + winnerChange,
      loserRating: Math.max(0, loserRating + loserChange),
      winnerChange,
      loserChange
    };
  }
  
  static updateRatingsForDraw(rating1: number, rating2: number) {
    return {
      player1Rating: rating1,
      player2Rating: rating2,
      player1Change: 0,
      player2Change: 0
    };
  }
}