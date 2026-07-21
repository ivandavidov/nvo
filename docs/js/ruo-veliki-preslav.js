// Данни за минимален и максимален бал по паралелки след 7 клас — РУО Veliki-preslav
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
ruoSchools["2700282"] = {n: "ПГ по селско стоп.", f: "ПГ по селско стопанство", c: false, p: {
  "4285": {n: "Техник-растениевъд/Растителна защита и агрохимия", d: [
    [[167.5,0,0,286,0,0], null, [69,0,0,94.5,0,0], null],
    [[67.5,67.5,116.5,285.5,134,285.5], null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
  "1080": {n: "Техник-лесовъд/ Горско и ловно стопанство", d: [
    [[91,0,0,208.5,0,0], null, null, null],
    [[107,107,0,297.8,297.75,0], null, null, null],
    [[71,71,0,198,198,0], null, [245,245,0,245,245,0], null],
    [null, null, null, null]
  ]},
  "4856": {n: "Икономист/Горско стопанство", d: [
    [null, null, null, null],
    [null, null, null, null],
    [[60,60,155,197.75,114,197.75], null, [104.5,104.5,0,144,144,0], null],
    [null, null, null, null]
  ]},
  "29813": {n: "Стопанисване на горите", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[49,49,0,155,155,0], null, null, null]
  ]},
  "29819": {n: "Агроекология и растителна защита", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[41,44,41,137,137,127], null, null, null]
  ]},
}};
ruoSchools["2700024"] = {n: "ПТГ Симеон Велики", f: "ПТГ Симеон Велики", c: false, p: {
  "2136": {n: "Икономическа информатика - дуална", d: [
    [[144,0,0,315,0,0], null, null, null],
    [[72,243,72,317.5,317.5,280], null, null, null],
    [[116,0,116,252,0,252], null, null, null],
    [null, null, null, null]
  ]},
  "3645": {n: "Техник по транспортна техника/ Пътностроителна техника", d: [
    [[82,0,0,278.5,0,0], null, [54,0,0,124,0,0], null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
  "4688": {n: "Икономическа информатика - дневна", d: [
    [null, null, null, null],
    [[113,113,0,289.5,289.5,0], null, null, null],
    [[99,131,99,293,252.5,293], null, null, null],
    [null, null, null, null]
  ]},
  "4690": {n: "Пътно-строителна техника - дневна", d: [
    [null, null, null, null],
    [[92,92,0,202,202,0], null, null, null],
    [[115,115,0,269.5,269.5,0], null, null, null],
    [null, null, null, null]
  ]},
  "28697": {n: "Икономическа информатика", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[97,162,97,423,295,423], null, null, null]
  ]},
  "28712": {n: "Пътностроителна техника - дневна", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[78,78,0,268,268,0], null, null, null]
  ]},
  "28713": {n: "Пътностроителна техника - дуална", d: [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [[60,60,0,208,208,0], null, null, null]
  ]},
}};
ruoSchools["2700103"] = {n: "СУ Ч. Храбър", f: "СУ Черноризец Храбър", c: false, p: {
  "1094": {n: "Софтуерни и хардуерни науки/ Информатика, информационни технологии", d: [
    [[70.5,0,0,307.75,0,0], null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ]},
}};
