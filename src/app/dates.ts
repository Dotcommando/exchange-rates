export class Day {
  value: number;
  X: number;
  Y: number;
  cost: number;
  diff: number;
  asDate: Date;
  constructor(value: number, X: number, Y: number, cost: number, diff: number, date: Date = new Date()) {
    this.value = value;
    this.X = X;
    this.Y = Y;
    this.cost = cost;
    this.diff = diff;
    this.asDate = date;
  }
}
export class Month {
  value: number;
  items: Day[];
  constructor(value: number, items: Day[]) {
    this.value = value;
    this.items = items;
  }
}
export class Year {
  value: number;
  items: Month[];
  constructor(value: number, items: Month[]) {
    this.value = value;
    this.items = items;
  }
}
export class DatePoints {
  items: Year[];
  min: number;
  max: number;
  cacheYear: number[];
  cacheMonth: number[][];
  cacheDay: number[][][];
  sumOfYears: number;
  sumOfMonthes: number[];
  sumOfDaysInMonthes: number[][];
  totalMonthes: number;

  constructor(points: Year[]) {
    this.items = points;
    this.clearCache();
    this.min = -1;
    this.max = -1;
    this.sumOfYears = 0;
    this.sumOfMonthes = [];
    this.sumOfDaysInMonthes = [];
    this.totalMonthes = 0;
  }
  clearCache(): void {
    this.cacheYear = [];
    this.cacheMonth = [];
    this.cacheDay = [];
  }

  /**
   * Возвращает -1, если такого года нет,
   * либо ключ массива, соответствующего позиции искомого года.
   * @param {number} year
   * @returns {number}
   */
  isYear(year: number): number {
    if (this.cacheYear[year] !== undefined) { return this.cacheYear[year]; }
    const len: number = this.items.length;
    let result = -1;
    for (let i = 0; i < len; i++) {
      if (this.items[i].value === year) {
        result = i;
        this.cacheYear[year] = i;
        break;
      }
    }
    return result;

  }

  /**
   * Возвращает [-1, -1], если такого месяца нет, либо ключ массива,
   * соответствующего позиции искомого месяца.
   * @param {number} year
   * @param {number} month
   * @returns {number[]}
   */
  isMonth(year: number, month: number): number[] {

    let result: number[] = [-1, -1];
    const yearKey: number = (this.cacheYear[year] !== undefined) ? this.cacheYear[year] : this.isYear(year);

    if (yearKey < 0) { return [-1, -1]; }

    if ((this.cacheMonth[year] !== undefined) && (yearKey > -1)) {
      if (this.cacheMonth[year][month] !== undefined) {
        return [yearKey, this.cacheMonth[year][month]];
      }
    }

    if (this.items[yearKey].value === year) {
      const monthLen = this.items[yearKey].items.length;
      for (let i = 0; i < monthLen; i++) {
        if (this.items[yearKey].items[i].value === month) {
          result = [yearKey, i];
          this.cacheYear[year] = yearKey;
          if (this.cacheMonth[year] === undefined) { this.cacheMonth[year] = []; }
          this.cacheMonth[year][month] = i;
          break;
        }
      }
    }
    return result;
  }

  /**
   * Возвращает [-1, -1, -1], если такого дня нет.
   * Либо ключ массива, соответствующего позиции искомого дня.
   */
  isDay(year: number, month: number, day: number): number[] {

    let result: number[] = [-1, -1, -1];
    const yearKey: number = (this.cacheYear[year] !== undefined) ? this.cacheYear[year] : this.isYear(year);
    if (yearKey === -1) { return [-1, -1, -1]; }
    const monthKey: number = (this.isMonth(year, month)[0] < 0 || this.isMonth(year, month)[1] < 0) ? -1 : this.isMonth(year, month)[1];
    if (monthKey === -1) { return [-1, -1, -1]; }

    if (this.cacheDay[year] !== undefined) {
      if (this.cacheDay[year][month] !== undefined) {
        if (this.cacheDay[year][month][day] !== undefined) {
          return [yearKey, monthKey, this.cacheDay[year][month][day]];
        }
      }
    }

    if ((this.items[yearKey].value === year) && (this.items[yearKey].items[monthKey].value === month)) {
      const daysLen = this.items[yearKey].items[monthKey].items.length;
      for (let i = 0; i < daysLen; i++) {
        if (this.items[yearKey].items[monthKey].items[i].value === day) {
          result = [yearKey, monthKey, i];
          if (this.cacheDay[year] === undefined) { this.cacheDay[year] = []; }
          if (this.cacheDay[year][month] === undefined) { this.cacheDay[year][month] = []; }
          if (this.cacheDay[year][month][day] === undefined) { this.cacheDay[year][month][day] = i; }
          break;
        }
      }
    }

    return result;

  }
  sortYears(dates: DatePoints): DatePoints {
    dates.items.sort(function(a: Year, b: Year){
      if (a.value > b.value) { return 1; }
      if (a.value === b.value) { return 0; }
      if (a.value < b.value) { return -1; }
    });
    return dates;
  }
  sortMonthes(monthOfYear: Year): Year {
    // console.log('year: ' + monthOfYear.value);
    monthOfYear.items.sort(function(a: Month, b: Month){
      if (a.value > b.value) { return 1; }
      if (a.value === b.value) { return 0; }
      if (a.value < b.value) { return -1; }
    });
    // console.log(monthOfYear.items);
    return monthOfYear;
  }
  sortDays(daysOfMonth: Month): Month {
    // console.log('    month: ' + daysOfMonth.value);
    daysOfMonth.items.sort(function(a: Day, b: Day){
      if (a.value > b.value) { return 1; }
      if (a.value === b.value) { return 0; }
      if (a.value < b.value) { return -1; }
    });
    // console.log(daysOfMonth.items);
    return daysOfMonth;
  }
  calcDiff(currEl: Day, prevEl: Day): void {

    if ((prevEl === undefined) || (currEl.cost === undefined) || (prevEl.cost === undefined)) {
      currEl.diff = 0;
      return;
    }

    currEl.diff = Math.round((currEl.cost - prevEl.cost) * 100) / 100;

  }
}

export const Monthes: string[] = [
  '',
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
];

export const ofMonth: string[] = [
  '',
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря'
];
