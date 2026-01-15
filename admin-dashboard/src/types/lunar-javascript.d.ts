declare module 'lunar-javascript' {
  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    getSolar(): Solar;
  }

  export class Solar {
    getYear(): number;   // 년도
    getMonth(): number;  // 월 (1-12)
    getDay(): number;    // 일 (1-31) - 주의: 요일이 아니라 날짜!
    _p: {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      second: number;
    };
  }
}
