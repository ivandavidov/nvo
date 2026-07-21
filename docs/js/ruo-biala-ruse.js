// Данни за минимален и максимален бал по паралелки след 7 клас — РУО Biala-ruse
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
ruoSchools["1802005"] = {n: "ПГ Бяла", f: "ПГ Бяла", c: false, p: {
  "4142": {n: "Автотранспортна техника", d: [
    [[59,0,0,310,0,0], null, [108,0,0,108,0,0], [236,0,0,236,0,0]],
    [[30,0,0,305.5,0,0], null, null, null],
    [[104,0,0,314.5,0,0], null, [149,0,0,149,0,0], null],
    [null, null, null, null]
  ]},
  "4143": {n: "Производство на облекло от текстил", d: [
    [[130,0,0,283,0,0], null, [52,0,0,244.5,0,0], null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
  "4502": {n: "Производство на кулинарни изделия и напитки", d: [
    [null, null, null, null],
    [[131,0,0,319,0,0], null, [181.5,0,0,280,0,0], null],
    [[85,0,0,384,0,0], null, [110,0,0,110,0,0], null],
    [null, null, null, null]
  ]},
  "29414": {n: "Автомобилна техника и мехатроника", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[63,0,0,297.5,0,0], null, null, null]
  ]},
  "29419": {n: "Устойчива мода", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[30,0,0,234,0,0], null, null, null]
  ]},
}};
ruoSchools["1802004"] = {n: "СУ Панайот Волов", f: "СУ Панайот Волов", c: false, p: {
  "3582": {n: "Икономическа информатика", d: [
    [[90,0,0,418.5,0,0], [212,0,0,212,0,0], null, null],
    [[127,0,0,419.5,0,0], [232,0,0,232,0,0], null, null],
    [null, null, null, null],
    [[134,0,0,406.5,0,0], null, null, null]
  ]},
  "3967": {n: "Спортно-туристическа дейност", d: [
    [[69,0,0,300,0,0], null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
  "3969": {n: "Фитнес", d: [
    [[132,0,0,255,0,0], [224,0,0,224,0,0], null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
  "4723": {n: "Компютърна графика", d: [
    [null, null, null, null],
    [[100,0,0,301.5,0,0], [197,0,0,197,0,0], null, [161,0,0,161,0,0]],
    [[76,0,0,398.5,0,0], null, null, null],
    [null, null, null, null]
  ]},
  "4877": {n: "Икономика и мениджмънт", d: [
    [null, null, null, null],
    [null, null, null, null],
    [[58,0,0,462.5,0,0], null, null, null],
    [null, null, null, null]
  ]},
  "29967": {n: "Социални дейности", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[61,0,0,229.5,0,0], [98.5,0,0,98.5,0,0], null, null]
  ]},
  "29985": {n: "Туристическа анимация", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[63,0,0,178,0,0], null, null, null]
  ]},
}};
