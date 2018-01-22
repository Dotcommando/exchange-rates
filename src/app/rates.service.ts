import {Injectable} from '@angular/core';
import {RATES} from './rates-data';

@Injectable()
export class RateService {
	getRates() {
		return Promise.resolve(RATES);
	}
}