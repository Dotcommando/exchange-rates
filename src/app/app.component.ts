import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CanvasSettings } from './canvas-settings';
import { Rate } from './rate';
import { RateService } from './rates.service';
import { DatePoints, Year, Month, Day } from './dates';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
	providers: [RateService]
})

export class AppComponent implements OnInit, AfterViewInit {

	title = 'Exchange Rates via Canvas';
	bgrdCanvas = new CanvasSettings("bgrdCanvas");
	interactiveCanvas = new CanvasSettings("iaCanvas");
	rates: Rate[];
	dateArray: DatePoints;

	constructor(private _rateService: RateService){

	}

	ngOnInit() {

console.time('timeOfOnInit');
		this.getRates(); 		// получаем массив котировок в this.rates
		this.parseDataArray();	// перебиваем значения в объект this.dateArray
		this.organizeArray();	// сортируем, чтобы даты в массивах this.dateArray шли по порядку друг за другом
		this.setDiffs();		// высчитываем diffы между каждой парой точек в this.dateArray
		this.setAxisExtremums();
		this.calculateCoords();
console.timeEnd('timeOfOnInit');

}
	ngAfterViewInit() {

		this.drawBGRD();

	}
	getRates():void {
		//this.rates = this._rateService.getRates(); // без ожидания
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

		let dateString = rate.date;
		let dateArrString: string[];
		let dateArrNumber: number[];
		dateArrString = dateString.split(".", 3);
		dateArrNumber = Array.from(dateArrString, x => parseInt(x));
		if ((dateArrNumber.length != 3) || (dateArrNumber[0] > 31) || (dateArrNumber[1] > 12)) return [0,0,0];
		for (let i = 0; i < 3; i++) {
			if ((isNaN(dateArrNumber[i])) || (dateArrNumber[i] === undefined)){
				dateArrNumber = [0,0,0];
				break;
			};
		}
		return dateArrNumber;

	}
	parseDataArray():void {

		let dataSource: Rate[] = this.rates;
		const len: number = dataSource.length;
		let pointsObj: DatePoints;
		let date: Array<number>;
		let yearKey: boolean | number = false;
		let yearMonth: boolean | number = false;
		let monthKey: boolean | number = false;
		let dayKey: boolean | number = false;

		for (let i = 0;i < len;i++) {

			date = this.parseDateFromRate(dataSource[i]);
			if (date[0] == 0 || date[1] == 0 || date[2] == 0) continue;
			let year = date[2];
			let month = date[1];
			let day = date[0];
			let isMonth: number[];
			let isDay: number[];

			if (pointsObj === undefined) pointsObj = new DatePoints([]);

			yearKey = pointsObj.isYear(year);

			if (yearKey < 0) {
				pointsObj.items.push({value: year, items:[]});
				yearKey = pointsObj.isYear(year);
			}

			pointsObj.cacheYear[year] = yearKey;
			isMonth = pointsObj.isMonth(year, month);

			monthKey = ( isMonth[0] < 0 || isMonth[1] < 0 )? -1 : isMonth[1];

			if (monthKey < 0) {
				pointsObj.items[yearKey].items.push({value: month, items:[]});
				monthKey = pointsObj.isMonth(year, month)[1];
			}

			if (pointsObj.cacheMonth[year] == undefined) pointsObj.cacheMonth[year] = [];
			pointsObj.cacheMonth[year][month] = monthKey;

			pointsObj.items[yearKey].items[monthKey].items.push({value: day, X: null, Y: null, cost: (Math.round(dataSource[i].value * 100) / 100 ), diff:null});

			dayKey = pointsObj.isDay(year, month, day)[2];
			if (pointsObj.cacheDay[year] == undefined) pointsObj.cacheDay[year] = [];
			if (pointsObj.cacheDay[year][month] == undefined) pointsObj.cacheDay[year][month] = [];
			pointsObj.cacheDay[year][month][day] = dayKey;

		}

		this.dateArray = pointsObj;
		//console.log((7.364+6.011+7.903+6.979+7.708+7.090+8.662+7.349+8.911+7.965)/10);
		//console.log((5.307+5.798+6.188+5.731+5.340+5.505+6.688+6.029+6.143+11.711)/10);
/*
		console.log("cacheYear == ");
		console.log(pointsObj.cacheYear);
		console.log("==-----------------------------==");
		console.log(" ");
		console.log("cacheMonth == ");
		console.log(pointsObj.cacheMonth);
		console.log("==-----------------------------==");
		console.log(" ");
		console.log("cacheDay == ");
		console.log(pointsObj.cacheDay);
		console.log("==-----------------------------==");
*/
	}
	organizeArray():void {

		let that: DatePoints = this.dateArray;

		that.sortYears(that);
		that.items.forEach(function(monthOfYear){
			that.sortMonthes(monthOfYear);
			monthOfYear.items.forEach(function(daysOfMonth){ // Сортируем дни внутри каждого месяца
				that.sortDays(daysOfMonth);
			});
		});

		this.dateArray = that;

	}
	setDiffs():void {
		
		let that: DatePoints = this.dateArray;
		let yearLen: number = that.items.length - 1;
		let monthLen: number = 0;
		let dayLen: number = 0;
		let currentEl: Day = {value: null, X: null, Y: null, cost: null, diff: null};
		let prevEl: Day = undefined;
		let prevDayLen: number;
		let prevMonthLen: number;
		let prevYearLen: number;

		if (yearLen < 0) return;

		for (let i = yearLen; i >= 0; i--) {

			monthLen = that.items[i].items.length - 1;
			if (monthLen < 0) return;

			for (let j = monthLen; j >= 0; j--) {

				dayLen = that.items[i].items[j].items.length - 1;
				if (dayLen < 0) return;

				for (let k = dayLen; k >= 0; k--) {

					currentEl = that.items[i].items[j].items[k];

					if ( (that.min < 0) || (currentEl.cost < that.min) ) that.min = currentEl.cost; // заодно минимум и максимум за период определим
					if ( that.max < currentEl.cost ) that.max = currentEl.cost;

					if (k > 0) {
						prevEl = that.items[i].items[j].items[k - 1];
					} else {
						if (j > 0) {
							prevDayLen = that.items[i].items[j-1].items.length - 1;
							prevEl = that.items[i].items[j-1].items[prevDayLen];
						} else {
							if (i > 0) {
								prevMonthLen = that.items[i-1].items.length - 1;
								prevDayLen = that.items[i-1].items[prevMonthLen].items.length - 1;
								prevEl = that.items[i-1].items[prevMonthLen].items[prevDayLen];
							}
						}
					}

					that.calcDiff(currentEl, prevEl);
					//console.log(`${that.items[i].items[j].items[k].value}.${that.items[i].items[j].value}.${that.items[i].value} цена ${that.items[i].items[j].items[k].cost}, разница ${that.items[i].items[j].items[k].diff}`);

				}

			}

		}

		//console.log(that.min);
		//console.log(that.max);

	}
	calculateCoords():void {

		let that: DatePoints = this.dateArray;
		let realCanvasWidth = this.bgrdCanvas.width - this.bgrdCanvas.right - this.bgrdCanvas.left;
		let realCanvasHeight = this.bgrdCanvas.height - this.bgrdCanvas.top - this.bgrdCanvas.bottom;
		//console.log(`${realCanvasWidth} x ${realCanvasHeight}`);
		let sumOfYears: number = that.items.length;
		let sumOfMonthes: number[] = [];
		let sumOfDaysInMonthes: number[][] = [];
		let yearLen: number = 0;
		let monthLen: number = 0;
		let dayLen: number = 0;
		let totalDays: number = 0;
		let totalMonthes: number = 0;
		let axisXpart: number = 0; // кол-во пикселей в одном из делений по оси X

		for (let i = 0; i < sumOfYears; i++) {
			monthLen = that.items[i].items.length;
			sumOfMonthes[i] = monthLen;
			totalMonthes += monthLen;
			for (let j = 0; j < monthLen; j++) {
				dayLen = that.items[i].items[j].items.length;
				if (sumOfDaysInMonthes[i] == undefined) sumOfDaysInMonthes[i] = [];
				sumOfDaysInMonthes[i][j] = dayLen;
				totalDays += dayLen;
				//console.log("sumOfDaysInMonthes[" + i + "][" + j + "]    " + sumOfDaysInMonthes[i][j]);
			}
		}

		axisXpart = Math.round((realCanvasWidth / (totalMonthes + 1)) * 100) / 100;
		this.bgrdCanvas.axisXpart = axisXpart;

		for (let i = 0; i < totalMonthes; i++) {

			this.bgrdCanvas.axisXmonthes[i] = this.bgrdCanvas.left + (axisXpart / 2) + (axisXpart * i);

		}

		yearLen = sumOfYears;
		monthLen = 0;
		dayLen = 0;

		for (let i = 0; i < yearLen; i++) {

			monthLen = that.items[i].items.length;

			for (let j = 0; j < monthLen; j++) {

				dayLen = that.items[i].items[j].items.length;

				for (let k = 0; k < dayLen; k++) {

					that.items[i].items[j].items[k].Y = this.bgrdCanvas.top + Math.round((realCanvasHeight * (this.bgrdCanvas.maxY - that.items[i].items[j].items[k].cost)/(this.bgrdCanvas.maxY - this.bgrdCanvas.minY)) * 100) / 100;
					
					that.items[i].items[j].items[k].X = Math.round( ( this.bgrdCanvas.left + (realCanvasWidth / (totalMonthes)) * (j + i*12) + (axisXpart/sumOfDaysInMonthes[i][j]) * k ) * 100) / 100;

//console.log(that.items[i].items[j].items[k].X + "    " + that.items[i].items[j].items[k].Y);
//console.log((realCanvasWidth / (totalMonthes + 1)) * (j + i*12));
//console.log(`${that.items[i].items[j].items[k].value}.${that.items[i].items[j].value}.${that.items[i].value} цена ${that.items[i].items[j].items[k].cost}, разница ${that.items[i].items[j].items[k].diff}`);

				}

			}

		}

	}
	setAxisExtremums():void {

		let that: DatePoints = this.dateArray;
		if ((that.min < 0) || (that.min == undefined)) return;
		if ((that.max < 0) || (that.max == undefined)) return;
		let range = that.max - that.min;

		this.bgrdCanvas.minY = Math.floor((that.min - (range * 0.1)) * 10) / 10;
		this.bgrdCanvas.maxY = Math.floor((that.max + (range * 0.1)) * 10) / 10;

		//console.log(this.bgrdCanvas.minY + "    " + this.bgrdCanvas.maxY);

	}
	drawBGRD():void {

		let canvas: any = document.getElementById(this.bgrdCanvas.idSelector);
		let ctx = canvas.getContext("2d");
		let that: DatePoints = this.dateArray;
		let realCanvasWidth = this.bgrdCanvas.width - this.bgrdCanvas.right - this.bgrdCanvas.left;
		let realCanvasHeight = this.bgrdCanvas.height - this.bgrdCanvas.top - this.bgrdCanvas.bottom;
		const CanvasYAxisZero = this.bgrdCanvas.top + realCanvasHeight;
		const CanvasYAxisMax = this.bgrdCanvas.top;
		let yearLen: number;
		let monthLen: number;
		let dayLen: number;
		let prevX: number = that.items[0].items[0].items[0].X;
		let prevY: number = that.items[0].items[0].items[0].Y;
		let linY: number = 0; // Линия коридора, значение будет меняться в ходе работы
		let linYVal: number = 0; // Значение шкалы линии коридора

		// Ось X
		ctx.beginPath();
		ctx.moveTo(this.bgrdCanvas.left, CanvasYAxisZero);
		ctx.lineTo(this.bgrdCanvas.left + realCanvasWidth, CanvasYAxisZero);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#E5E7E9";
		ctx.lineCap = "square";
		ctx.stroke();

		// Верхняя линия коридора
		ctx.beginPath();
		ctx.moveTo(this.bgrdCanvas.left, CanvasYAxisMax);
		ctx.lineTo(this.bgrdCanvas.left + realCanvasWidth, CanvasYAxisMax);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#E5E7E9";
		ctx.lineCap = "square";
		ctx.stroke();

		// Линия нижней трети
		ctx.beginPath();
		linYVal = Math.floor((this.bgrdCanvas.minY + (this.bgrdCanvas.maxY - this.bgrdCanvas.minY) * 0.3333) * 10) / 10;
		linY = this.bgrdCanvas.top + (Math.floor(realCanvasHeight * 0.6667 * 100) / 100);
		ctx.moveTo(this.bgrdCanvas.left, linY);
		ctx.lineTo(this.bgrdCanvas.left + realCanvasWidth, linY);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#E5E7E9";
		ctx.lineCap = "square";
		ctx.stroke();

		ctx.font = "normal 12px Calibri";
		ctx.fillStyle = "#99a0a8";
		ctx.fillText(linYVal, this.bgrdCanvas.left - 26, linY + 3);
		
		// Линия верхней трети
		ctx.beginPath();
		linYVal = Math.floor((this.bgrdCanvas.minY + (this.bgrdCanvas.maxY - this.bgrdCanvas.minY) * 0.6667) * 10) / 10;
		linY = this.bgrdCanvas.top + (Math.floor(realCanvasHeight * 0.3333 * 100) / 100);
		ctx.moveTo(this.bgrdCanvas.left, linY);
		ctx.lineTo(this.bgrdCanvas.left + realCanvasWidth, linY);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#E5E7E9";
		ctx.lineCap = "square";
		ctx.stroke();

		ctx.font = "normal 12px Calibri";
		ctx.fillStyle = "#99a0a8";
		ctx.fillText(linYVal, this.bgrdCanvas.left - 26, linY + 3);

		ctx.font = "normal 12px Calibri";
		ctx.fillStyle = "#99a0a8";
		ctx.fillText(this.bgrdCanvas.maxY, this.bgrdCanvas.left - 26, this.bgrdCanvas.top + 3);
		ctx.fillText(this.bgrdCanvas.minY, this.bgrdCanvas.left - 26, this.bgrdCanvas.top + realCanvasHeight + 3);

		yearLen = that.items.length;
		monthLen = 0;
		dayLen = 0;

		for (let i = 0; i < yearLen; i++) {

			monthLen = that.items[i].items.length;

			for (let j = 0; j < monthLen; j++) {

				dayLen = that.items[i].items[j].items.length;

				for (let k = 0; k < dayLen; k++) {

					ctx.beginPath();
					ctx.moveTo(prevX, prevY);
					ctx.lineTo(that.items[i].items[j].items[k].X, that.items[i].items[j].items[k].Y);
					ctx.lineWidth = 2;
					ctx.strokeStyle = "#74A3C7";
					ctx.lineCap = "round";
					ctx.stroke();
					prevX = that.items[i].items[j].items[k].X;
					prevY = that.items[i].items[j].items[k].Y

				}

			}

		}

	}
}
