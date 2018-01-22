export class CanvasSettings {

	idSelector: string;
	width: number;
	height: number;

	top: number;
	right: number;
	bottom: number;
	left: number;

	constructor(selector: string){
		this.idSelector = selector;
		this.width = 900;
		this.height = 280;
		this.top = 20;
		this.right = 30;
		this.bottom = 20;
		this.left = 30;
	}

}