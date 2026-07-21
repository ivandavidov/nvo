// Данни за минимален и максимален бал по паралелки след 7 клас — РУО Isperih
// Генериран от RuoDecomplexor. НЕ редактирай ръчно.
//
// ruoYears — масив от години с данни
//
// ruoSchools — обект с ключ = код на училище
//   n        — кратко наименование (от School.schoolCodes; при липса — от CSV)
//   f        — пълно наименование (от School.schoolCodes; при липса — от CSV)
//   c        — true ако е частно училище
//   p        — паралелки, обект с ключ = код на паралелка
//     n  — наименование на паралелката
//     d  — данни: масив по позиция на година (съвпада с ruoYears)
//            всяка година: масив от 4 класирания (по позиция, 0 = 1-во)
//            всяко класиране: [мин_общо, мин_м, мин_ж, макс_общо, макс_м, макс_ж]
//                             или null (паралелката е попълнена в предходно класиране)

let ruoYears = [2023, 2024, 2025, 2026];

let ruoSchools = {};
ruoSchools["1701405"] = {n: "ПГ по сел. стоп.", f: "ПГ по сел. стоп. Хан Аспарух", c: false, p: {
  "2801": {n: "Администратор в хотелиерството", d: [
    [[67,0,0,248,0,0], null, null, null],
    [[78,0,0,160,0,0], [63,0,0,63,0,0], null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
  "2748": {n: "Икономист-информатик", d: [
    [[90,0,0,288.5,0,0], null, null, null],
    [[92,0,0,347.5,0,0], null, null, null],
    [[216,0,0,292.5,0,0], null, null, null],
    [null, null, null, null]
  ]},
  "4364": {n: "Монтьор на селскостопанска техника", d: [
    [[54,0,0,245,0,0], null, [131,0,0,131,0,0], null],
    [[74,0,0,205,0,0], null, [49,0,0,49,0,0], null],
    [[66,0,0,177,0,0], null, null, null],
    [null, null, null, null]
  ]},
  "2785": {n: "Техник на селскостопанска техника", d: [
    [[122,0,0,291,0,0], null, null, null],
    [[116,0,0,188.5,0,0], null, null, null],
    [[154,0,0,320.5,0,0], null, null, null],
    [null, null, null, null]
  ]},
  "2795": {n: "Техник- растениевъд", d: [
    [[30,0,0,73,0,0], null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
  "4365": {n: "Хотелиерство, ресторантьорство и кетъринг - ресторантьор", d: [
    [[72,0,0,196,0,0], null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
  "4781": {n: "Електротехник - дуална форма на обучение", d: [
    [null, null, null, null],
    [[119,0,0,342,0,0], null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
  "5008": {n: "Ресторантьор", d: [
    [null, null, null, null],
    [null, null, null, null],
    [[30,0,0,198,0,0], null, null, null],
    [null, null, null, null]
  ]},
  "29643": {n: "Електроснабдяване и електрообзавеждане - дуална", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[30,0,0,258,0,0], null, null, null]
  ]},
  "29624": {n: "Икономическа информатика", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[41,0,0,404.5,0,0], null, null, null]
  ]},
  "29640": {n: "Механизация и цифровизация в аграрния сектор", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[75,0,0,338.5,0,0], null, null, null]
  ]},
  "29645": {n: "Ресторантьорство и кетъринг", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[44,0,0,214,0,0], null, null, null]
  ]},
}};
ruoSchools["1701401"] = {n: "ПГ Васил Левски", f: "ПГ Васил Левски", c: false, p: {
  "1501": {n: "Биология и здравно образование", d: [
    [[161,0,0,381.5,0,0], [30,0,0,30,0,0], null, null],
    [[148,0,0,376.5,0,0], [87,0,0,87,0,0], null, null],
    [[151,0,0,364.5,0,0], null, null, null],
    [[107,0,0,317.5,0,0], null, null, null]
  ]},
  "1509": {n: "Приложно програмиране", d: [
    [[124,0,0,370.5,0,0], null, null, null],
    [[62,0,0,346.5,0,0], null, null, null],
    [[110,0,0,402,0,0], null, null, null],
    [null, null, null, null]
  ]},
  "3798": {n: "Икономическо развитие", d: [
    [[85,0,0,341,0,0], null, [126,0,0,126,0,0], null],
    [[110,0,0,381,0,0], null, [149,0,0,149,0,0], null],
    [[58,0,0,162,0,0], null, [124,0,0,197,0,0], null],
    [[65,0,0,313.5,0,0], null, null, null]
  ]},
  "29907": {n: "Разработка на софтуер", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[116,0,0,398,0,0], null, null, null]
  ]},
}};
