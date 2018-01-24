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
	title = 'Exchange Rate via Canvas';
	bgrdCanvas = new CanvasSettings("bgrdCanvas");
	interactiveCanvas = new CanvasSettings("iaCanvas");
	rates: Rate[];
	dateArray: DatePoints;
	constructor(private _rateService: RateService){}
	ngOnInit() {
		this.getRates();
		this.setDateArray();
	}
	getRates() {
		//this.rates = this._rateService.getRates();
		this._rateService.getRates().then(rates => this.rates = rates);
	}
	setDateArray() {
		let points: Year[];

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
			}]
		}];

		let that: DatePoints;
		that = new DatePoints(points);

		that.sortYears(that);
		that.items.forEach(function(monthOfYear){
			that.sortMonthes(monthOfYear);
			monthOfYear.items.forEach(function(daysOfMonth){ // Сортируем дни внутри каждого месяца
				that.sortDays(daysOfMonth);
			});
		});

		this.dateArray = that;
		console.log(this.dateArray);

	}
}
