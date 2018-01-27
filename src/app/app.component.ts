import { Component, OnInit } from '@angular/core';
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

export class AppComponent implements OnInit {

	title = 'Exchange Rates via Canvas';
	bgrdCanvas = new CanvasSettings("bgrdCanvas");
	interactiveCanvas = new CanvasSettings("iaCanvas");
	rates: Rate[];
	dateArray: DatePoints;

	constructor(private _rateService: RateService){
		
	}

	ngOnInit() {
console.time('timeOfOnInit');
		this.getRates();
		this.parseDataArray();
		this.organizeArray();
console.timeEnd('timeOfOnInit');
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
			

			pointsObj.items[yearKey].items[monthKey].items.push({value: day, X: null, Y: null, cost: dataSource[i].value, diff:null});

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

		let points: Year[];
		let that: DatePoints = this.dateArray;
/*
		points = [{ // массив содержит объекты лет
			value: 2018,
			items: [{ // массив содержит объекты месяцев
				value: 3,
				items: [{ // массив содержит объекты дней
					value: 16,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 14,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 15,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 11,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 13,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 12,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				}]
			},{
				value: 1,
				items: [{ // массив содержит объекты дней
					value: 1,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 8,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 2,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 5,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 3,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 6,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				}]
			}]
		},{
			value: 2017,
			items: [{
				value: 4,
				items: [{
					value: 16,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 14,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 15,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 11,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 13,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 12,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				}]
			},{
				value: 3,
				items: [{ // массив содержит объекты дней
					value: 1,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 8,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 2,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 5,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 3,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 6,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				}]
			},{
				value: 5,
				items: [{ // массив содержит объекты дней
					value: 1,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 8,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 2,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 5,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 3,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 6,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				}]
			},{
				value: 8,
				items: [{ // массив содержит объекты дней
					value: 1,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 8,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 2,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 5,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 3,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				},{
					value: 6,
					X: 456,
					Y: 243,
					cost: 65.4576,
					diff: 0.7245
				}]
			}]
		}];

		that = new DatePoints(points);
*/
		that.sortYears(that);
		that.items.forEach(function(monthOfYear){
			that.sortMonthes(monthOfYear);
			monthOfYear.items.forEach(function(daysOfMonth){ // Сортируем дни внутри каждого месяца
				that.sortDays(daysOfMonth);
			});
		});

		this.dateArray = that;

	}
}
