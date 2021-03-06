import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Renderer2
} from '@angular/core';
import { CanvasSettings } from './canvas-settings';
import { Rate } from './rate';
import { RateService } from './rates.service';
import { DatePoints, Year, Month, Day, Monthes, ofMonth } from './dates';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [RateService]
})

export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('helper') helper: ElementRef;

  event: MouseEvent;
  clientX = 0;
  clientY = 0;
  prevX = 0;
  prevY = 0;
  title = 'Exchange Rates via Canvas';
  bgrdCanvas: CanvasSettings = new CanvasSettings('bgrdCanvas');
  dynCanvas: CanvasSettings = new CanvasSettings('iaCanvas');
  rates: Rate[];
  dateArray: DatePoints;
  cacheChart = {};
  dateStamp: Date;
  isThrottled = false; // Дроссель запуска this.redraw
  tooltip: {date: string, cost: string, diff: string, diffColor: string};

  onEvent(event: MouseEvent): void {
    this.event = event;
  }

  /**
   * Запускает redraw через дроссель.
   * @param {MouseEvent} event
   * @returns {undefined}
   */
  redrawWrapper(event: MouseEvent) {
    this.event = event;
    const that = this;
    let savedThis: any;
    function wrapper() {
      if (that.isThrottled) {
        savedThis = that;
        return;
      }
      that.redraw.call(that, that.event);
      that.isThrottled = true;
      setTimeout(function() {
        that.isThrottled = false;
        if (savedThis) {
          wrapper.apply(savedThis);
          savedThis = null;
        }
      }, 40);
    }

    return wrapper();

  }

  redraw(event: MouseEvent): void {

    // const nowStamp = new Date();
    /* if (this.dateStamp != undefined) {
            console.log(nowStamp - this.dateStamp);
        }*/
    this.dateStamp = new Date();
    // console.time('timeOfRedraw'); // Подтверждение работы кэша
    const that: DatePoints = this.dateArray;
    const realCanvasWidth: number = this.dynCanvas.width - this.dynCanvas.right - this.dynCanvas.left;
    const realCanvasHeight: number = this.dynCanvas.height - this.dynCanvas.top - this.dynCanvas.bottom;
    const canvas: any = document.getElementById(this.dynCanvas.idSelector);
    const ctx = canvas.getContext('2d');
    let whichMonth = -1;
    let whichYear = -1;
    let currentDayIndex = 0; 	// Индекс текщего дня в массиве DatePoints
    let clientX = 0;
    const CanvasYAxisZero = this.bgrdCanvas.top + realCanvasHeight;
    const CanvasYAxisMax = this.bgrdCanvas.top;
    const cacheChart = this.cacheChart;
    let yearMonth: number[] = [-1, -1]; // Массив с целевым годом и месяцем, потому что метод их передаст в таком формате.
                                        // Иначе 2 раза рассчитывать придётся одно и то же

    this.clientX = Math.round(event.clientX - canvas.getBoundingClientRect().x);
    this.clientY = Math.round(event.clientY - canvas.getBoundingClientRect().y);

    clientX = this.clientX;

    if (cacheChart[clientX] !== undefined) {

      whichYear = cacheChart[clientX].year;
      whichMonth = cacheChart[clientX].month;
      currentDayIndex = cacheChart[clientX].day;
      this.prevX = this.clientX;
      this.prevY = this.clientY;
      // console.log('Drew with cache ' + clientX);

    } else {

      yearMonth = this.getYearMonthByX(clientX);
      whichYear = yearMonth[0];
      whichMonth = yearMonth[1];

      if (whichYear < 0 || whichMonth < 0) {
        this.prevX = this.clientX;
        this.prevY = this.clientY;
        return;
      }

      currentDayIndex = this.getDayByX(whichYear, whichMonth, clientX);

      cacheChart[clientX] = {};
      cacheChart[clientX].year = whichYear;
      cacheChart[clientX].month = whichMonth;
      cacheChart[clientX].day = currentDayIndex;

      // console.log(that.items[whichYear].value + ' . ' + that.items[whichYear].items[whichMonth].value + ' . ' +
      // that.items[whichYear].items[whichMonth].items[currentDayIndex].value);

    }

    const point: Day = that.items[whichYear].items[whichMonth].items[currentDayIndex];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dashList: number[] = [3, 3];

    ctx.beginPath();
    ctx.setLineDash(dashList);
    ctx.moveTo(point.X, point.Y);
    ctx.lineTo(point.X, CanvasYAxisZero);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#E5E7E9';
    ctx.lineCap = 'square';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(point.X, point.Y, 5, 0, 2 * Math.PI, true);
    ctx.fillStyle = '#f6f7f8';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(point.X, point.Y, 4, 0, 2 * Math.PI, true);
    ctx.fillStyle = '#74a3c7';
    ctx.fill();

    this.redrawHelper(point, whichYear, whichMonth, currentDayIndex);

    this.prevX = this.clientX;
    this.prevY = this.clientY;
    // console.timeEnd('timeOfRedraw');

  }

  getYearMonthByX(clientX: number): number[] {

    const realCanvasWidth: number = this.dynCanvas.width - this.dynCanvas.right - this.dynCanvas.left;
    const maxClientCanvasX = this.dynCanvas.left + realCanvasWidth;
    const that: DatePoints = this.dateArray;
    const totalMonthes: number = that.totalMonthes;
    const axisXpart: number = this.bgrdCanvas.axisXpart;
    let partOfMonthes = 0; 	// вспомогательная переменная при поиске диапазона clientX с точночтью до месяца
    let indexOfPart = 0; 		// вспомогательная переменная, содержит индекс месяца, в который попадает clientX
    let whichYear: number;
    let whichMonth: number;

    if (clientX > maxClientCanvasX) { // курсор ещё в Canvasе, но уже за рамками графика
      return [-1, -1];
    }

    if (this.prevX === clientX) { // Если курсор смещается по вертикали, оставляем всё как есть
      return [-1, -1];
    }

    partOfMonthes += this.dynCanvas.left;
    for (let i = 0; i < totalMonthes; i++ ) { // считаем, в каком месяце по порядку находится курсор

      partOfMonthes += axisXpart;
      if (partOfMonthes >= clientX) {
        indexOfPart = i;
        break;
      }

    }

    if (indexOfPart < that.sumOfMonthes[0]) {
      whichYear = 0;
      whichMonth = indexOfPart;
    } else {
      // В любом случае, в каждом следующем году
      // после первого, по 12 месяцев.
      whichYear = 1 + (Math.floor((indexOfPart - that.sumOfMonthes[0]) / 12));
      whichMonth = (indexOfPart - that.sumOfMonthes[0]) % 12;
    }

    if ((whichYear < 0) || (whichMonth < 0) || (clientX < 0)) {
      return [-1, -1];
    }
    if (that.sumOfDaysInMonthes[whichYear] === undefined) {
      return [-1, -1];
    }
    if (that.sumOfDaysInMonthes[whichYear][whichMonth] === undefined) {
      return [-1, -1];
    }

    return [whichYear, whichMonth];

  }

  getDayByX(whichYear: number, whichMonth: number, clientX: number): number {

    const that: DatePoints = this.dateArray;
    let monthRange: Month = that.items[whichYear].items[whichMonth];
    let currentDayIndex: number;
    let prevValue = -1; // Для отслеживания предыдущего значения X в перечислении массива DatePoints
                        // заведомо даём несуществующее значение
    const sumOfDaysInMonth: number = that.sumOfDaysInMonthes[whichYear][whichMonth]; // Число дней в месяце, в который входит день

    if (sumOfDaysInMonth === undefined) { return -1; }

    for (let k = 0; k < sumOfDaysInMonth; k++ ) {

      // если точка оказалась зажата между месяцами справа
      if ((k === sumOfDaysInMonth - 1) && (clientX > monthRange.items[k].X)) {
        monthRange = that.items[whichYear].items[whichMonth];
        currentDayIndex = k;
        break;
      }

      // если это первая итерация и точка между месяцами слева
      if ((prevValue < 0) && (monthRange.items[k].X >= clientX)) {
        currentDayIndex = k;
        break;
      }

      // итерация первая, но не попали
      if (prevValue < 0) {
        prevValue = k;
        continue;
      }

      // точка оказалась между предыдущим и текущим значениями
      if ((monthRange.items[k].X >= clientX) && (monthRange.items[prevValue].X < clientX)) {
        if ((monthRange.items[k].X - clientX) > (clientX - monthRange.items[prevValue].X)) {
          currentDayIndex = prevValue;
          break;
        } else {
          currentDayIndex = k;
          break;
        }
      }

      // точка оказалась сильно позади, т.е. и предыдущее и текущее значения больше остатка
      if ((monthRange.items[prevValue].X >= clientX) && (monthRange.items[k].X > clientX)) {
        currentDayIndex = prevValue;
        break;
      }

    }

    return currentDayIndex;

  }

  redrawHelper(point: Day, year: number, month: number, day: number): void {

    const helperNode = this.helper.nativeElement;
    const that: DatePoints = this.dateArray;
    // let diff = helperNode.querySelector('.helper-data__diff');

    // helperNode.querySelector('.helper-data__cost').textContent = '$ ' + point.cost;
    this.tooltip.cost = '$ ' + point.cost;
    // helperNode.querySelector('.canv-helper__date').textContent =
    // point.value + ' ' + ofMonth[that.items[year].items[month].value] + ' ' + that.items[year].value;
    this.tooltip.date = point.value + ' ' + ofMonth[that.items[year].items[month].value] + ' ' + that.items[year].value;
    helperNode.style.display = 'inline-block';

    if (point.diff < 0) {
      this.tooltip.diff = '▼' + Math.abs(point.diff);
      this.tooltip.diffColor = '#af111c';
      // diff.style.color = '#af111c';
      // diff.textContent = '▼' + Math.abs(point.diff);
    }
    if (point.diff > 0) {
      this.tooltip.diff = '▲' + point.diff;
      this.tooltip.diffColor = '#22a053';
      // diff.style.color = '#22a053';
      // diff.textContent = '▲' + point.diff;
    }
    if (point.diff === 0) {
      this.tooltip.diff = ' ' + point.diff;
      this.tooltip.diffColor = '#9299a2';
      // diff.style.color = '#9299a2';
      // diff.textContent = ' ' + point.diff;
    }

    this.setHelperPosition(point);

  }

  setHelperPosition(point: Day): void {

    const helperNode = this.helper.nativeElement;
    const heightString = window.getComputedStyle(helperNode).height;
    const widthString = window.getComputedStyle(helperNode).width;
    const width = parseFloat(widthString.replace('px', ''));
    const height = parseFloat(heightString.replace('px', ''));
    const maxWidth: number = this.dynCanvas.width;

    helperNode.style.top = (point.Y - height - 6) + 'px';

    if ((width + point.X + 8) <= maxWidth) {
      helperNode.style.left = (point.X + 6) + 'px';
    } else {
      helperNode.style.left = (point.X - 6 - width) + 'px';
    }

  }

  constructor(private _rateService: RateService) {}

  ngOnInit() {

    console.time('timeOfOnInit');
    this.getRates(); 		// получаем массив котировок в this.rates
    this.parseDataArray();	// перебиваем значения в объект this.dateArray
    this.organizeArray();	// сортируем, чтобы даты в массивах this.dateArray шли по порядку друг за другом
    this.setDiffs();		// высчитываем diffы между каждой парой точек в this.dateArray
    this.setAxisExtremums(); // устанавливаем максимум и минимум
                             // для оси Y
    this.calculateCoords();	// просчитываем координаты для каждой точки
    this.initTooltip();		// создаём объект подсказки в компоненте и проставляем пустые строки в свойства
    console.timeEnd('timeOfOnInit');

  }
  ngAfterViewInit() {
    this.drawAxisesAndCurve();	// один раз отрисовываем оси, линии третей и сам график
  }

  getRates(): void {
    // this.rates = this._rateService.getRates(); // без ожидания
    /*
        this._rateService.getRates().then(			 // с промисами. Больше не работает
            rates => {
                this.rates = rates;
                console.log(this.rates);
            }
        );
        */
    this._rateService.getRates()
      .subscribe(rates => this.rates = rates);

  }
  parseDateFromRate(rate: Rate): Array<number> {

    const dateString = rate.date;
    let dateArrString: string[];
    let dateArrNumber: number[];
    dateArrString = dateString.split('.', 3);
    dateArrNumber = Array.from(dateArrString, x => parseInt(x, 10));
    if ((dateArrNumber.length !== 3) || (dateArrNumber[0] > 31) || (dateArrNumber[1] > 12)) { return [0, 0, 0]; }
    for (let i = 0; i < 3; i++) {
      if ((isNaN(dateArrNumber[i])) || (dateArrNumber[i] === undefined)) {
        dateArrNumber = [0, 0, 0];
        break;
      }
    }
    return dateArrNumber;

  }
  parseDataArray(): void {

    const dataSource: Rate[] = this.rates;
    const len: number = dataSource.length;
    let pointsObj: DatePoints;
    let date: Array<number>;
    let yearKey: boolean | number = false;
    let monthKey: boolean | number = false;
    let dayKey: boolean | number = false;

    for (let i = 0; i < len; i++) {

      date = this.parseDateFromRate(dataSource[i]);
      if (date[0] === 0 || date[1] === 0 || date[2] === 0) { continue; }
      const year = date[2];
      const month = date[1];
      const day = date[0];
      let isMonth: number[];

      if (pointsObj === undefined) { pointsObj = new DatePoints([]); }

      yearKey = pointsObj.isYear(year);

      if (yearKey < 0) {
        pointsObj.items.push({value: year, items: []});
        yearKey = pointsObj.isYear(year);
      }

      pointsObj.cacheYear[year] = yearKey;
      isMonth = pointsObj.isMonth(year, month);

      monthKey = ( isMonth[0] < 0 || isMonth[1] < 0 ) ? -1 : isMonth[1];

      if (monthKey < 0) {
        pointsObj.items[yearKey].items.push({value: month, items: []});
        monthKey = pointsObj.isMonth(year, month)[1];
      }

      if (pointsObj.cacheMonth[year] === undefined) { pointsObj.cacheMonth[year] = []; }
      pointsObj.cacheMonth[year][month] = monthKey;

      pointsObj.items[yearKey].items[monthKey].items.push({
        value: day,
        X: null,
        Y: null,
        cost: (Math.round(dataSource[i].value * 100) / 100 ),
        diff: null,
        asDate: new Date(year, month, day)
      });

      dayKey = pointsObj.isDay(year, month, day)[2];
      if (pointsObj.cacheDay[year] === undefined) { pointsObj.cacheDay[year] = []; }
      if (pointsObj.cacheDay[year][month] === undefined) { pointsObj.cacheDay[year][month] = []; }
      pointsObj.cacheDay[year][month][day] = dayKey;

    }

    this.dateArray = pointsObj;

  }
  organizeArray(): void {

    const that: DatePoints = this.dateArray;

    that.sortYears(that);
    that.items.forEach((monthOfYear) => {
      that.sortMonthes(monthOfYear);
      monthOfYear.items.forEach(function(daysOfMonth){ // Сортируем дни внутри каждого месяца
        that.sortDays(daysOfMonth);
      });
    });

    this.dateArray = that;

  }
  setDiffs(): void {

    const that: DatePoints = this.dateArray;
    const yearLen: number = that.items.length - 1;
    let monthLen = 0;
    let dayLen = 0;
    let currentEl: Day = {value: null, X: null, Y: null, cost: null, diff: null, asDate: null};
    let prevEl: Day;
    let prevDayLen: number;
    let prevMonthLen: number;

    if (yearLen < 0) { return; }

    for (let i = yearLen; i >= 0; i--) {

      monthLen = that.items[i].items.length - 1;
      if (monthLen < 0) { return; }

      for (let j = monthLen; j >= 0; j--) {

        dayLen = that.items[i].items[j].items.length - 1;
        if (dayLen < 0) { return; }

        for (let k = dayLen; k >= 0; k--) {

          currentEl = that.items[i].items[j].items[k];

          // заодно минимум и максимум за период определим
          if ( (that.min < 0) || (currentEl.cost < that.min) ) {
            that.min = currentEl.cost;
          }
          if ( that.max < currentEl.cost ) {
            that.max = currentEl.cost;
          }

          if (k > 0) {
            prevEl = that.items[i].items[j].items[k - 1];
          } else {
            if (j > 0) {
              prevDayLen = that.items[i].items[j - 1].items.length - 1;
              prevEl = that.items[i].items[j - 1].items[prevDayLen];
            } else {
              if (i > 0) {
                prevMonthLen = that.items[i - 1].items.length - 1;
                prevDayLen = that.items[i - 1].items[prevMonthLen].items.length - 1;
                prevEl = that.items[i - 1].items[prevMonthLen].items[prevDayLen];
              }
            }
          }

          that.calcDiff(currentEl, prevEl);
          // console.log(`${that.items[i].items[j].items[k].value}.${that.items[i].items[j].value}.${that.items[i].value} цена ${that.items[i].items[j].items[k].cost}, разница ${that.items[i].items[j].items[k].diff}`);

        }

      }

    }

  }
  calculateCoords(): void {

    const that: DatePoints = this.dateArray;
    const realCanvasWidth = this.bgrdCanvas.width - this.bgrdCanvas.right - this.bgrdCanvas.left;
    const realCanvasHeight = this.bgrdCanvas.height - this.bgrdCanvas.top - this.bgrdCanvas.bottom;
    const sumOfYears: number = that.items.length;
    const sumOfMonthes: number[] = []; // месяцев в каждом году
    const sumOfDaysInMonthes: number[][] = [];
    let yearLen = 0;
    let monthLen = 0;
    let dayLen = 0;
    let totalDays = 0;
    let totalMonthes = 0; // месяцев всего на шкале X
    let axisXpart = 0; // кол-во пикселей в одном из делений по оси X

    for (let i = 0; i < sumOfYears; i++) {
      monthLen = that.items[i].items.length;
      sumOfMonthes[i] = monthLen;
      totalMonthes += monthLen;
      for (let j = 0; j < monthLen; j++) {
        dayLen = that.items[i].items[j].items.length;
        if (sumOfDaysInMonthes[i] === undefined) { sumOfDaysInMonthes[i] = []; }
        sumOfDaysInMonthes[i][j] = dayLen;
        totalDays += dayLen;
        // console.log('sumOfDaysInMonthes[' + i + '][' + j + ']    ' + sumOfDaysInMonthes[i][j]);
      }
    }

    that.sumOfYears = sumOfYears;
    that.sumOfMonthes = sumOfMonthes;
    that.sumOfDaysInMonthes = sumOfDaysInMonthes;
    that.totalMonthes = totalMonthes;

    axisXpart = Math.round((realCanvasWidth / totalMonthes) * 100) / 100;
    this.bgrdCanvas.axisXpart = axisXpart;

    for (let i = 0; i < totalMonthes; i++) {
      this.bgrdCanvas.axisXmonthes[i] = this.bgrdCanvas.left + (axisXpart * i);
    }

    yearLen = sumOfYears;
    monthLen = 0;
    dayLen = 0;
    let monthes = -1;

    for (let i = 0; i < yearLen; i++) {

      monthLen = that.items[i].items.length;

      for (let j = 0; j < monthLen; j++) {

        dayLen = that.items[i].items[j].items.length;
        monthes++;
        if (j === monthLen - 1) { that.sumOfMonthes[i] = j + 1; }

        for (let k = 0; k < dayLen; k++) {

          that.items[i].items[j].items[k].Y =
            this.bgrdCanvas.top + Math.round(
              (realCanvasHeight *
              (this.bgrdCanvas.maxY - that.items[i].items[j].items[k].cost) / (this.bgrdCanvas.maxY - this.bgrdCanvas.minY)) * 100
            ) / 100;

          that.items[i].items[j].items[k].X =
            Math.round(
              ( this.bgrdCanvas.left + axisXpart * monthes + (axisXpart / sumOfDaysInMonthes[i][j]) * k ) * 100
            ) / 100; // вместо (j + i * 12) -- тут используем monthes,
                     // т.к. месяцы могут и с июня начаться, например.
                     // Это зависит от выбранного диапазона

          // console.log(that.items[i].items[j].items[k].X + '    ' + that.items[i].items[j].items[k].Y);
          // console.log((realCanvasWidth / (totalMonthes + 1)) * (j + i*12));
          // console.log(`${that.items[i].items[j].items[k].value}.${that.items[i].items[j].value}.${that.items[i].value} цена ${that.items[i].items[j].items[k].cost}, разница ${that.items[i].items[j].items[k].diff}`);

        }

      }

    }

  }
  initTooltip(): void {

    this.tooltip = {
      date: '',
      cost: '',
      diff: '',
      diffColor: ''
    };

  }
  setAxisExtremums(): void {

    const that: DatePoints = this.dateArray;
    if ((that.min < 0) || (that.min === undefined)) { return; }
    if ((that.max < 0) || (that.max === undefined)) { return; }
    const range = that.max - that.min;

    this.bgrdCanvas.minY = Math.floor((that.min - (range * 0.1)) * 10) / 10;
    this.bgrdCanvas.maxY = Math.floor((that.max + (range * 0.1)) * 10) / 10;

    // console.log(this.bgrdCanvas.minY + '    ' + this.bgrdCanvas.maxY);

  }
  drawAxisesAndCurve(): void {

    const canvas: any = document.getElementById(this.bgrdCanvas.idSelector);
    const ctx = canvas.getContext('2d');
    const that: DatePoints = this.dateArray;
    const realCanvasWidth = this.bgrdCanvas.width - this.bgrdCanvas.right - this.bgrdCanvas.left;
    const realCanvasHeight = this.bgrdCanvas.height - this.bgrdCanvas.top - this.bgrdCanvas.bottom;
    const CanvasYAxisZero = this.bgrdCanvas.top + realCanvasHeight;
    const CanvasYAxisMax = this.bgrdCanvas.top;
    let yearLen: number;
    let monthLen: number;
    let dayLen: number;
    let prevX: number = that.items[0].items[0].items[0].X;
    let prevY: number = that.items[0].items[0].items[0].Y;
    let linY = 0; // Линия коридора, значение будет меняться в ходе работы
    let linYVal = 0; // Значение шкалы линии коридора

    // Ось X
    ctx.beginPath();
    ctx.moveTo(this.bgrdCanvas.left, CanvasYAxisZero);
    ctx.lineTo(this.bgrdCanvas.left + realCanvasWidth, CanvasYAxisZero);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#E5E7E9';
    ctx.lineCap = 'square';
    ctx.stroke();

    // Верхняя линия коридора
    ctx.beginPath();
    ctx.moveTo(this.bgrdCanvas.left, CanvasYAxisMax);
    ctx.lineTo(this.bgrdCanvas.left + realCanvasWidth, CanvasYAxisMax);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#E5E7E9';
    ctx.lineCap = 'square';
    ctx.stroke();

    // Линия нижней трети
    ctx.beginPath();
    linYVal = Math.floor((this.bgrdCanvas.minY + (this.bgrdCanvas.maxY - this.bgrdCanvas.minY) * 0.3333) * 10) / 10;
    linY = this.bgrdCanvas.top + (Math.floor(realCanvasHeight * 0.6667 * 100) / 100);
    ctx.moveTo(this.bgrdCanvas.left, linY);
    ctx.lineTo(this.bgrdCanvas.left + realCanvasWidth, linY);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#E5E7E9';
    ctx.lineCap = 'square';
    ctx.stroke();

    ctx.font = 'normal 12px Calibri';
    ctx.fillStyle = '#99a0a8';
    ctx.fillText(linYVal, this.bgrdCanvas.left - 26, linY + 3);

    // Линия верхней трети
    ctx.beginPath();
    linYVal = Math.floor((this.bgrdCanvas.minY + (this.bgrdCanvas.maxY - this.bgrdCanvas.minY) * 0.6667) * 10) / 10;
    linY = this.bgrdCanvas.top + (Math.floor(realCanvasHeight * 0.3333 * 100) / 100);
    ctx.moveTo(this.bgrdCanvas.left, linY);
    ctx.lineTo(this.bgrdCanvas.left + realCanvasWidth, linY);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#E5E7E9';
    ctx.lineCap = 'square';
    ctx.stroke();

    ctx.font = 'normal 12px Calibri';
    ctx.fillStyle = '#99a0a8';
    ctx.fillText(linYVal, this.bgrdCanvas.left - 26, linY + 3);

    ctx.font = 'normal 12px Calibri';
    ctx.fillStyle = '#99a0a8';
    ctx.fillText(this.bgrdCanvas.maxY, this.bgrdCanvas.left - 26, this.bgrdCanvas.top + 3);
    ctx.fillText(this.bgrdCanvas.minY, this.bgrdCanvas.left - 26, this.bgrdCanvas.top + realCanvasHeight + 3);

    yearLen = that.items.length;
    monthLen = 0;
    dayLen = 0;

    for (let i = 0; i < yearLen; i++) {

      monthLen = that.items[i].items.length;
      ctx.beginPath();
      ctx.moveTo(that.items[i].items[0].items[0].X, CanvasYAxisZero);
      ctx.lineTo(that.items[i].items[0].items[0].X, CanvasYAxisZero + 30);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#E5E7E9';
      ctx.lineCap = 'square';
      ctx.stroke();

      ctx.font = 'normal 12px Calibri';
      ctx.fillStyle = '#99a0a8';
      ctx.textAlign = 'left';
      ctx.fillText(that.items[i].value + ' →', that.items[i].items[0].items[0].X + 12, CanvasYAxisZero + 28);

      // рисуем график на статичном необновляемом слое
      for (let j = 0; j < monthLen; j++) {

        dayLen = that.items[i].items[j].items.length;
        ctx.font = 'normal 12px Calibri';
        ctx.fillStyle = '#99a0a8';
        ctx.textAlign = 'center';
        ctx.fillText(Monthes[that.items[i].items[j].value], this.bgrdCanvas.left + that.items[i].items[j].items[0].X, CanvasYAxisZero + 14);

        for (let k = 0; k < dayLen; k++) {

          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(that.items[i].items[j].items[k].X, that.items[i].items[j].items[k].Y);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#74A3C7';
          ctx.lineCap = 'round';
          ctx.stroke();
          prevX = that.items[i].items[j].items[k].X;
          prevY = that.items[i].items[j].items[k].Y;

        }

      }

    }

  }

}
