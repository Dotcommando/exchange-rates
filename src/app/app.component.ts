import { Component, OnInit } from '@angular/core';
import { CanvasSettings } from './canvas-settings';
import { Rate } from './rate';
import { RateService } from './rates.service';

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
	constructor(private _rateService: RateService){}
	ngOnInit() {
		this.getRates();
		console.log(this.rates);
	}
	getRates() {
		//this.rates = this._rateService.getRates();
		this._rateService.getRates().then(rates => this.rates = rates);
	}
}
