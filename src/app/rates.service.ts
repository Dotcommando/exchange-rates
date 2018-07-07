import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Rate } from './rate';
import { RATES } from './rates-data';

@Injectable()
/*
export class RateService {
	getRates() {
		return Promise.resolve(RATES);
		//return RATES;
	}
}*/
export class RateService {
  getRates(): Observable<Rate[]> {
    return of(RATES);
  }
}
