export class Day {
	value: number;
	X: number;
	Y: number;
	cost: number;
	diff: number;
}
export class Month {
	value: number;
	items: Day[];
}
export class Year {
	value: number;
	items: Month[];
}
export class DatePoints {
	items: Year[];
	constructor(points: Year[]) {
		this.items = points;
	}
	sortYears(dates: DatePoints):DatePoints {
		dates.items.sort(function(a: Year, b: Year){
			if (a.value > b.value) return 1;
			if (a.value == b.value) return 0;
			if (a.value < b.value) return -1;
		});
		return dates;
	}
	sortMonthes(monthOfYear: Year):Year {
		//console.log("year: " + monthOfYear.value);
		monthOfYear.items.sort(function(a: Month, b: Month){
			if (a.value > b.value) return 1;
			if (a.value == b.value) return 0;
			if (a.value < b.value) return -1;
		});
		//console.log(monthOfYear.items);
		return monthOfYear;
	}
	sortDays(daysOfMonth: Month):Month {
		//console.log("    month: " + daysOfMonth.value);
		daysOfMonth.items.sort(function(a: Day, b: Day){
			if (a.value > b.value) return 1;
			if (a.value == b.value) return 0;
			if (a.value < b.value) return -1;
		});
		//console.log(daysOfMonth.items);
		return daysOfMonth;
	}
}