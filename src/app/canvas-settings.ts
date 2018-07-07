export class CanvasSettings {

  idSelector: string;
  width: number;
  height: number;

  top: number;
  right: number;
  bottom: number;
  left: number;

  minY: number; // Минимальное значение по шкале Y (минимально возможное значение курса)
  maxY: number; // Максимальное значение по шкале Y (максимально возможное значение курса)

  axisXmonthes: number[]; // координаты месяцев по шкале X. Месяцы по ширине равны в незаисимости от кол-ва точек.
  axisXpart: number; // кол-во пикселей в одном из делений по оси X

  constructor(selector: string){
    this.idSelector = selector;
    this.width = 900;
    this.height = 280;
    this.top = 30;
    this.right = 30;
    this.bottom = 30;
    this.left = 30;
    this.minY = -1;
    this.maxY = -1;
    this.axisXmonthes = [];
    this.axisXpart = 0;

  }

}
