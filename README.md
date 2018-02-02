# ExchangeRates

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.5.5.

## Development server

Run `ng serve -o` for a dev server. Parameter `-o` will open new tab in your browser and show the SPA.

## О проекте

Проект сделан сугубо для получения умений в области разработки на Angular 2/5. Это мой первый проект на Angular, а так же первый опыт работы на TypeScript и первый опыт практического использования Canvas.

Проект реализует отображение графика курса валюты за некоторый промежуток времени. При наведении на график, на графике появляется точка и показывает дату и значение курса, а так же изменение по отношению к предыдущему дню.

Данные о курсе берутся из `src/app/rates-data.ts`.

Объект, в который перебиваются данные курса хранится в `src/app/dates.ts`.

Описание объекта Canvas, в котором хранятся предустановки для Canvasов, находится в `src/app/canvas-settings.ts`.
