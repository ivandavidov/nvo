/*
  Не всички данни са налични на 'data.egov.bg'.
  
  2020: http://www.danybon.com/obrazovanie/klasacia-bg-uchilista-izpit-math-7-class-2020
  2019: https://data.egov.bg/data/resourceView/ef1f9091-b2f3-416a-a29f-eb6bd8ed4da3
  2018: https://data.egov.bg/data/resourceView/7e605cbb-af31-4462-8503-ab26790a87b7
*/

let s = [];

// София
s[1] = {l: '1 СУ', n: '1 СУ Пенчо. П. Славейков', b: [65.81, 41.74, 68.91, 72.19], m: [51.35, 43.39, 48.96, 53.66]};
s[2] = {l: '2 СУ', n: '2 СУ Акад. Емилиян Станев', b: [68.40, 43.09, 73.20, 73.12], m: [46.74, 41.01, 49.74, 48.59]};
s[4] = {l: '4 ОУ', n: '4 ОУ Проф. Джон Атанасов', b: [67.18, 38.91, 63.86, 63.41], m: [56.27, 41.37, 46.20, 45.10]};
s[5] = {l: '5 ОУ', n: '5 ОУ Иван Вазов', b: [62.54, 38.88, 59.58, 61.59], m: [46.46, 37.24, 37.30, 45.38]};
s[6] = {l: '6 ОУ', n: '6 ОУ Граф Игнатиев', b: [70.35, 47.13, 78.34, 73.90], m: [46.02, 43.28, 59.54, 57.55]};
s[7] = {l: '7 СУ', n: '7 СУ Св. Седмочисленици', b: [68.99, 45.16, 71.72, 69.47], m: [65.42, 46.88, 57.11, 55.40]};
s[8] = {l: '8 СУ', n: '8 СУ Васил Левски', b: [63.87, null, 68.98, 63.13], m: [46.53, null, 51.83, 37.99]};
s[11] = {l: '11 ОУ', n: '11 ОУ Св. Пимен Зографски', b: [59.48, 39.85, 70.06, 67.93], m: [41.25, 39.88, 41.88, 50.73]};
s[12] = {l: '12 СУ', n: '12 СУ Цар Иван Асен II', b: [59.70, 39.83, 69.00, 65.69], m: [33.40, 41.04, 53.27, 51.16]};
s[14] = {l: '14 СУ', n: '14 СУ Проф. Асен Златаров', b: [62.86, 42.25, 68.87, 63.53], m: [44.59, 39.18, 36.73, 52.24]};
s[16] = {l: '16 ОУ', n: '16 ОУ Райко Жинзифов', b: [56.11, 35.05, 61.43, 57.68], m: [38.55, 35.51, 37.68, 38.99]};
s[17] = {l: '17 СУ', n: '17 СУ Дамян Груев', b: [62.42, 40.82, 67.79, 63.36], m: [39.39, 36.44, 46.73, 42.64]};
s[18] = {l: '18 СУ', n: '18 СУ Уилям Гладстон', b: [71.30, 45.19, 76.20, 73.21], m: [51.92, 45.45, 51.45, 56.26]};
s[19] = {l: '19 СУ', n: '19 СУ Елин Пелин', b: [67.01, 45.16, 74.97, 73.45], m: [54.82, 48.86, 54.15, 64.14]};
s[20] = {l: '20 ОУ', n: '20 ОУ Тодор Минков', b: [79.11, 50.23, 82.74, 79.19], m: [66.76, 52.12, 61.89, 65.92]};
s[21] = {l: '21 СУ', n: '21 СУ Христо Ботев', b: [65.85, 39.26, 64.39, 61.04], m: [49.74, 34.38, 39.65, 43.20]};
s[22] = {l: '22 СУ', n: '22 СЕУ Георги С. Раковски', b: [68.41, 45.52, 71.32, 71.93], m: [53.24, 45.24, 55.56, 58.89]};
s[23] = {l: '23 СУ', n: '23 СУ Фр. Жолио-Кюри', b: [63.01, 37.82, 61.76, 61.69], m: [42.40, 38.96, 35.18, 40.46]};
s[25] = {l: '25 ОУ', n: '25 ОУ Д-р Петър Берон', b: [65.15, 40.66, 60.86, 67.54], m: [50.67, 40.21, 46.12, 49.46]};
s[31] = {l: '31 СУ', n: '31 СУЧЕМ Иван Вазов', b: [69.18, 46.18, 74.85, 75.15], m: [60.46, 48.15, 58.94, 60.83]};
s[32] = {l: '32 СУ', n: '32 СУ Св. Климент Охридски', b: [69.47, 47.72, 76.87, 79.44], m: [55.11, 47.85, 61.45, 63.02]};
s[34] = {l: '34 ОУ', n: '34 ОУ Стою Шишков', b: [65.25, 40.10, 67.13, 68.59], m: [48.20, 39.60, 53.09, 52.63]};
s[35] = {l: '35 СУ', n: '35 СУ Добри Войников', b: [71.44, 44.33, 75.48, 70.17], m: [55.83, 40.95, 58.28, 59.95]};
s[36] = {l: '36 СУ', n: '36 СУ Максим Горки', b: [68.79, 45.91, 71.93, 70.20], m: [49.84, 47.64, 50.83, 52.53]};
s[38] = {l: '38 ОУ', n: '38 ОУ Васил Априлов', b: [74.04, 44.71, 77.78, 71.77], m: [61.09, 45.42, 62.22, 60.97]};
s[41] = {l: '41 ОУ', n: '41 ОУ Св. Патриарх Евтимий', b: [68.12, 43.57, 70.10, 74.45], m: [58.95, 46.17, 52.34, 64.37]};
s[43] = {l: '43 ОУ', n: '43 ОУ Христо Смирненски', b: [64.09, 39.65, 68.14, 63.00], m: [43.89, 33.78, 39.83, 38.81]};
s[51] = {l: '51 СУ', n: '51 СУ Елисавета Багряна', b: [68.19, 44.76, 74.43, 72.85], m: [52.37, 44.91, 57.24, 55.61]};
s[54] = {l: '54 СУ', n: '54 СУ Св. Иван Рилски', b: [60.45, 40.78, 70.04, 65.62], m: [38.32, 41.22, 42.31, 44.93]};
s[55] = {l: '55 СУ', n: '55 СУ Петко Каравелов', b: [72.31, 44.76, 72.25, 71.90], m: [62.16, 46.28, 58.13, 60.56]};
s[73] = {l: '73 СУ', n: '73 СУ Владислав Граматик', b: [76.16, 48.89, 82.02, 80.39], m: [67.05, 49.31, 69.19, 72.23]};
s[81] = {l: '81 СУ', n: '81 СУ Виктор Юго', b: [62.05, 41.00, 65.51, 64.60], m: [49.36, 41.19, 42.95, 52.28]};
s[101] = {l: '101 СУ', n: '101 СУ Бачо Киро', b: [50.08, null, 60.74, 48.60], m: [27.41, null, 35.35, 37.27]};
s[104] = {l: '104 ОУ', n: '104 ОУ Захари Стоянов', b: [67.22, 43.38, 75.91, 72.21], m: [56.40, 41.10, 52.62, 59.79]};
s[105] = {l: '105 СУ', n: '105 СУ Атанас Далчев', b: [63.65, 42.77, 71.48, 71.88], m: [50.83, 42.17, 48.28, 55.95]};
s[107] = {l: '107 ОУ', n: '107 ОУ Хан Крум', b: [75.37, 49.55, 80.41, 79.85], m: [76.16, 54.27, 73.32, 75.23]};
s[109] = {l: '109 ОУ', n: '109 ОУ Христо Смирненски', b: [63.54, 40.91, 70.08, 63.95], m: [52.48, 39.81, 54.66, 48.47]};
s[112] = {l: '112 ОУ', n: '112 ОУ Стоян Заимов', b: [59.94, 41.31, 66.74, 70.88], m: [43.40, 42.27, 44.89, 52.68]};
s[118] = {l: '118 СУ', n: '118 СУ Людмил Стоянов', b: [63.34, 39.28, 71.12, 67.02], m: [40.79, 41.94, 47.41, 47.32]};
s[119] = {l: '119 СУ', n: '119 СУ Акад. М. Арнаудов', b: [72.02, 43.74, 72.87, 74.34], m: [55.13, 46.10, 56.33, 61.40]};
s[120] = {l: '120 ОУ', n: '120 ОУ Георги С. Раковски', b: [76.90, 43.75, 73.44, 73.86], m: [61.65, 46.31, 60.91, 57.01]};
s[121] = {l: '121 СУ', n: '121 СУ Георги Измирлиев', b: [54.57, 39.16, 63.46, 57.92], m: [35.20, 30.43, 35.08, 38.92]};
s[122] = {l: '122 ОУ', n: '122 ОУ Николай Лилиев', b: [63.78, 43.37, 72.37, 70.50], m: [50.18, 46.00, 52.00, 59.14]};
s[125] = {l: '125 СУ', n: '125 СУ Проф. Боян Пенев', b: [75.32, 48.65, 78.34, 75.92], m: [65.18, 49.49, 62.57, 65.20]};
s[127] = {l: '127 СУ', n: '127 СУ Иван Денкоглу', b: [60.31, 36.64, 62.24, 66.03], m: [45.26, 39.20, 41.18, 45.60]};
s[129] = {l: '129 ОУ', n: '129 ОУ Антим I', b: [68.45, 42.42, 73.45, 72.43], m: [51.66, 41.96, 48.71, 52.97]};
s[133] = {l: '133 СУ', n: '133 СУ А. С. Пушкин', b: [71.79, 47.17, 78.87, 76.68], m: [51.17, 47.70, 56.81, 60.44]};
s[134] = {l: '134 СУ', n: '134 СУ Димчо Дебелянов', b: [71.96, 45.52, 73.97, 74.68], m: [57.36, 48.72, 55.70, 62.90]};
s[138] = {l: '138 СУ', n: '138 СУ Васил Златарски', b: [64.25, 40.43, 67.85, 66.05], m: [53.19, 43.11, 55.52, 54.29]};
s[139] = {l: '139 ОУ', n: '139 ОУ Захарий Круша', b: [64.18, 40.37, 68.62, 66.93], m: [43.37, 40.55, 44.15, 47.99]};
s[142] = {l: '142 ОУ', n: '142 ОУ Веселин Ханчев', b: [68.07, 41.93, 71.39, 68.95], m: [47.37, 38.58, 44.52, 48.18]};
s[143] = {l: '143 ОУ', n: '143 ОУ Георги Бенковски', b: [66.46, 44.56, 70.00, 67.70], m: [51.43, 46.62, 54.02, 54.27]};
s[145] = {l: '145 ОУ', n: '145 ОУ Симеон Радев', b: [78.02, 51.85, 85.39, 80.68], m: [73.54, 58.12, 71.05, 72.56]};
s[163] = {l: '163 ОУ', n: '163 ОУ Черноризец Храбър', b: [61.95, 37.52, 72.59, 69.96], m: [45.21, 36.71, 46.15, 53.78]};

s[201] = {l: 'СМГ', n: 'СМГ Паисий Хилендарски', b: [84.26, 55.64, 90.13, 88.46], m: [96.07, 63.64, 94.93, 94.46]};
s[202] = {l: 'НМУ', n: 'НМУ Любомир Пипков', b: [59.24, null, 68.64, 63.45], m: [35.20, null, 39.64, 37.35]};
s[203] = {l: 'НСУ', n: 'НСУ София', b: [61.68, 42.26, 70.82, 63.17], m: [45.65, 40.82, 45.85, 45.47]};
s[204] = {l: 'НУКК', n: 'НУКК (Италиански лицей)', b: [74.31, null, 77.54, 79.61], m: [59.95, null, 68.06, 61.92]};

s[211] = {l: 'Азбуки', n: 'ЧОУ Азбуки', b: [null, null, 77.28, 80.26], m: [null, null, 55.72, 64.77]};
s[212] = {l: 'Българско школо', n: 'ЧСУ Българско школо', b: [77.06, 47.36, 78.45, 78.45], m: [50.17, 49.36, 56.23, 68.56]};
s[213] = {l: 'Васил Златарски', n: 'ЧОУ Васил Златарски', b: [null, null, 73.57, 70.17], m: [null, null, 54.73, 57.03]};
s[214] = {l: 'ВЕДА', n: 'ЧУ ВЕДА', b: [74.94, 48.88, 83.28, 80.39], m: [74.89, 54.00, 78.76, 73.34]};
s[215] = {l: 'Галина С. Уланова', n: 'ЧСУ Галина С. Уланова', b: [62.64, 48.50, 73.33, 74.71], m: [42.00, 48.57, 38.33, 54.25]};
s[216] = {l: 'Дорис Тенеди', n: 'ЧЕСУ Дорис Тенеди', b: [75.33, 47.56, 81.50, 77.37], m: [56.48, 48.61, 68.98, 57.63]};
s[217] = {l: 'Ерих Кестнер', n: 'ЧУ Ерих Кестнер', b: [73.13, 46.18, 76.28, 80.14], m: [60.25, 48.43, 60.91, 69.86]};
s[218] = {l: 'ЕСПА', n: 'ЧСЕУ ЕСПА', b: [78.18, 52, 78.97, 81.24], m: [55.43, 52.20, 68.94, 84.71]};
s[219] = {l: 'Мария Монтесори', n: 'ЧОУ Д-р Мария Монтесори', b: [null, 56.00, 49.50, 46.75], m: [null, 62.00, 27.00, 39.50]};
s[220] = {l: 'Меридиан 22', n: 'ЧУ Меридиан 22', b: [80.50, 48.67, 80.69, 73.95], m: [59.34, 47.00, 56.70, 57.80]};
s[221] = {l: 'Образов. Технологии', n: 'ЧОУ Образов. Технологии', b: [62.74, 40.49, 71.32, 66.85], m: [48.70, 43.75, 61.87, 55.26]};
s[222] = {l: 'Орфей', n: 'ЧСУ Орфей', b: [84.75, null, 91.75, 62.25], m: [86.75, null, 86.75, 51.50]};
s[223] = {l: 'Петър Берон', n: 'ЧОУ Д-р Петър Берон', b: [76.97, 41.11, 76.32, 74.18], m: [57.06, 47.07, 63.89, 61.15]};
s[224] = {l: 'Петко Славейков', n: 'ЧСУ Петко Славейков', b: [61.71, 43.00, 75.96, 76.00], m: [48.54, 36.75, 59.09, 49.13]};
s[225] = {l: 'ПЧМГ', n: 'Първа Частна МГ', b: [85.50, 53.49, 86.64, 84.62], m: [91.64, 63.11, 90.95, 95.21]};
s[226] = {l: 'Св. Георги', n: 'ЧСУ Св. Георги', b: [67.84, 41.38, 73.94, 65.79], m: [49.91, 45.44, 50.16, 52.74]};
s[227] = {l: 'Св. Климент Охридски', n: 'ЧОУ Св. Климент Охридски', b: [72.96, 51.58, 80.50, 82.88], m: [65.85, 57.50, 59.04, 84.78]};
s[228] = {l: 'Св. София', n: 'ЧОУ Св. София', b: [83.86, 56.10, 89.75, 89.23], m: [87.83, 62.75, 87.66, 89.90]};
s[229] = {l: 'Светлина', n: 'ЧОУ Светлина', b: [72.00, 39.68, 57.40, 72.75], m: [61.44, 38.50, 49.70, 41.00]};
s[230] = {l: 'Увекинд', n: 'ЧСУ Увекинд', b: [63.48, 43.34, 72.77, 70.78], m: [44.01, 46.86, 52.92, 54.15]};
s[231] = {l: 'Цар Симеон Велики', n: 'ЧСУ Цар Симеон Велики', b: [80.07, 46.19, 73.15, 67.00], m: [67.71, 46.00, 62.68, 57.15]};

// Пловдив
s[251] = {l: 'МГ Акад. Кирил Попов', n: 'МГ Акад. Кирил Попов', b: [null, 55.67, 90.84, 90.11], m: [null, 63.87, 94.25, 92.26]};
s[252] = {l: 'НУМТИ Добрин Петков', n: 'НУМТИ Добрин Петков', b: [null, 40.64, 69.86, 67.44], m: [null, 31.31, 36.48, 38.55]};
s[253] = {l: 'Алеко Константинов', n: 'ОУ Алеко Константинов', b: [null, 46.66, 75.38, 74.79], m: [null, 43.68, 54.37, 61.02]};
s[254] = {l: 'Васил Левски', n: 'ОУ Васил Левски', b: [null, 40.64, 70.08, 65.93], m: [null, 37.66, 53.32, 45.62]};
s[255] = {l: 'Васил Петлешков', n: 'ОУ Васил Петлешков', b: [null, 37.88, 67.77, 64.34], m: [null, 38.11, 44.66, 42.44]};
s[256] = {l: 'Димитър Димов', n: 'ОУ Димитър Димов', b: [null, 20.92, 48.52, 60.26], m: [null, 23.22, 33.26, 46.25]};
s[257] = {l: 'Душо Хаджидеков', n: 'ОУ Душо Хаджидеков', b: [null, 46.36, 72, 74.13], m: [null, 45.58, 52.88, 62.64]};
s[258] = {l: 'Екзарх Антим I', n: 'ОУ Екзарх Антим I', b: [null, 43.62, 65.14, 70.65], m: [null, 44.69, 45.41, 60.12]};
s[259] = {l: 'Княз Александър I', n: 'ОУ Княз Александър I', b: [null, 45.66, 79.99, 73.46], m: [null, 46.59, 57.86, 54.66]};
s[260] = {l: 'Кочо Честеменски', n: 'ОУ Кочо Честеменски', b: [null, 43.77, 79.99, 69.47], m: [null, 41.18, 57.86, 46.50]};
s[261] = {l: 'Никола Вапцаров', n: 'СУ Никола Вапцаров', b: [null, 35.93, 58.05, 62.78], m: [null, 30.30, 31.92, 47.97]};
s[262] = {l: 'Патриарх Евтимий', n: 'СУ Св. Патриарх Евтимий', b: [null, 48.11, 79.27, 77.65], m: [null, 52.13, 67.79, 65.53]};
s[263] = {l: 'Пейо Кр. Яворов', n: 'СУ Пейо Кр. Яворов', b: [null, 32.72, 59.72, 56.63], m: [null, 31.61, 39.55, 34.40]};
s[264] = {l: 'Райна Княгиня', n: 'ОУ Райна Княгиня', b: [null, 45.42, 70.97, 69.16], m: [null, 47.44, 51.17, 52.48]};
s[265] = {l: 'Тютюнджян', n: 'ОУ Тютюнджян', b: [null, 39.72, 70.27, 64.36], m: [null, 34.49, 45.29, 49.30]};
s[266] = {l: 'Черноризец Храбър', n: 'СУ Черноризец Храбър', b: [null, 44.72, 59.50, 72.82], m: [null, 38.63, 37.24, 49.40]};
s[267] = {l: 'Яне Сандански', n: 'ОУ Яне Сандански', b: [null, 41.35, 69.09, 64.66], m: [null, 39.67, 48.33, 47.03]};

s[281] = {l: 'Бъдеще', n: 'ЧОУ Бъдеще', b: [null, 35.35, 60.31, 71.56], m: [null, 29.92, 33.94, 59.42]};
s[282] = {l: 'Дружба', n: 'ЧСУ Дружба', b: [null, 36.31, 63.01, 67.59], m: [null, 34.00, 38.15, 61.30]};
s[283] = {l: 'Класик', n: 'ЧОУ Класик', b: [null, 41.55, 59.42, 54.17], m: [null, 36.80, 24.75, 34.50]};

// Варна
s[291] = {l: 'МГ Д-р Петър Берон', n: 'МГ Д-р Петър Берон', b: [null, 54.89, 89.93, 90.43], m: [null, 64.38, 96.13, 96.45]};
s[292] = {l: 'Васил Друмев', n: 'ОУ Васил Друмев', b: [null, 36.91, 62.23, 63.19], m: [null, 36.56, 38.79, 52.55]};
s[293] = {l: 'Гео Милев', n: 'СУ Гео Милев', b: [null, 41.79, 69.92, 69.26], m: [null, 43.93, 53.67, 54.13]};
s[294] = {l: 'Георги Раковски', n: 'ОУ Георги С. Раковски', b: [null, 41.58, 71.76, 70.79], m: [null, 44.42, 52.61, 52.09]};
s[295] = {l: 'Захари Стоянов', n: 'ОУ Захари Стоянов', b: [null, 45.34, 77.58, 75.40], m: [null, 47.01, 59.59, 64.34]};
s[296] = {l: 'Йордан Йовков', n: 'ОУ Йордан Йовков', b: [null, 40.88, 66.73, 67.16], m: [null, 38.64, 43.88, 48.67]};
s[297] = {l: 'Кирил и Методий', n: 'ОУ Св. Св. Кирил и Методий', b: [null, 46.13, 78.23, 77.18], m: [null, 50.66, 62.77, 64.92]};
s[298] = {l: 'Климент Охридски', n: 'СУ Св. Климент Охридски', b: [null, 44.04, 75.19, 73.87], m: [null, 42.39, 59.07, 61.28]};
s[299] = {l: 'Найден Геров', n: 'VII СУ Найден Геров', b: [null, 44.02, 72.45, 72.27], m: [null, 49.19, 60.80, 67.09]};
s[300] = {l: 'Петко Славейков', n: 'ОУ Петко Р. Славейков', b: [null, 47.92, 75.19, 75.40], m: [null, 50.84, 65.51, 71.54]};
s[301] = {l: 'Пушкин', n: 'СУЕО Ал. С. Пушкин', b: [null, 46.38, 73.41, 75.90], m: [null, 50.17, 54.38, 60.93]};
s[302] = {l: 'Стефан Караджа', n: 'ОУ Стефан Караджа', b: [null, 38.81, 64.92, 65.39], m: [null, 33.56, 44.64, 49.02]};
s[303] = {l: 'Цар Симеон I', n: 'ОУ Цар Симеон I', b: [null, 40.24, 60.53, 65.25], m: [null, 35.32, 35.83, 49.12]};
s[304] = {l: 'Черноризец Храбър', n: 'ОУ Черноризец Храбър', b: [null, 38.14, 67.68, 70.47], m: [null, 38.85, 52.56, 52.52]};

s[321] = {l: 'Аз съм българче', n: 'ЧСУ Аз съм българче', b: [null, null, 44.50, 46.79], m: [null, null, 11, 28.64]};
s[322] = {l: 'Малкият принц', n: 'ЧОУ Малкият принц', b: [null, 43.17, 75.22, 66.14], m: [null, 38.59, 49.53, 48.57]};
s[323] = {l: 'Мечтатели', n: 'ЧСУ Мечтатели', b: [null, 30.88, 59.77, 60.69], m: [null, 25.12, 28.86, 55.25]};

// Бургас
s[331] = {l: 'ППМГ', n: 'ППМГ', b: [null, 54.89, 84.15, 86.16], m: [null, 64.38, 91.13, 95.34]};
s[332] = {l: 'Антон Страшимиров', n: 'ОУ Антон Страшимиров', b: [null, 40.36, 69.62, 68.06], m: [null, 40.11, 45.73, 51.79]};
s[333] = {l: 'Братя Миладинови', n: 'ОУ Братя Миладинови', b: [null, 41.34, 67.97, 65.13], m: [null, 43.63, 53.14, 51.35]};
s[334] = {l: 'Васил Априлов', n: 'ОУ Васил Априлов', b: [null, 43.85, 68.98, 73.66], m: [null, 42.89, 54.69, 58.21]};
s[335] = {l: 'Георги Бенковски', n: 'ОУ Георги Бенковски', b: [null, 37.26, 70.54, 64.00], m: [null, 37.71, 45.41, 45.19]};
s[336] = {l: 'Елин Пелин', n: 'ОУ Елин Пелин', b: [null, 38.24, 60.69, 63.62], m: [null, 37.60, 40.32, 47.43]};
s[337] = {l: 'Кирил и Методий', n: 'Кирил и Методий', b: [null, 41.84, 61.41, 65.95], m: [null, 33.10, 43.68, 44.55]};
s[338] = {l: 'Климент Охридски', n: 'ОУ Св. Климент Охридски', b: [null, 44.80, 69.37, 64.24], m: [null, 43.90, 41.37, 49.55]};
s[339] = {l: 'Княз Борис I', n: 'ОУ Св. Княз Борис I', b: [null, 36.90, 69.20, 59.68], m: [null, 35.06, 48.67, 45.47]};
s[340] = {l: 'Коджакафалията', n: 'Коджакафалията', b: [null, null, null, 81.61], m: [null, null, null, 74.03]};
s[341] = {l: 'Петко Славейков', n: 'ОУ Петко Р. Славейков', b: [null, 43.26, 67.71, 68.78], m: [null, 46.97, 54.84, 53.71]};

s[351] = {l: 'Първо Частно ОУ', n: 'Първо Частно ОУ', b: [null, 49.20, 80.12, 79.54], m: [null, 54.73, 68.51, 78.07]};

// Русе
s[361] = {l: 'МГ Баба Тонка', n: 'МГ Баба Тонка', b: [null, 49.39, 85.38, 85.15], m: [null, 61.31, 93.08, 90.11]};
s[362] = {l: 'Ал. Константинов', n: 'ОУ Алеко Константинов', b: [null, 13.85, 20.67, 25.36], m: [null, 19.08, 12.17, 30.13]};
s[363] = {l: 'Васил Левски', n: 'СУ Васил Левски', b: [null, 36.44, 51.95, 52.75], m: [null, 30.93, 28.05, 31.76]};
s[364] = {l: 'Възраждане', n: 'СУ Възраждане', b: [null, 35.63, 61.53, 56.72], m: [null, 31.08, 44.23, 39.53]};
s[365] = {l: 'Иван Вазов', n: 'ОУ Иван Вазов', b: [null, 40.44, 63.25, 65.68], m: [null, 47.69, 51.27, 50.27]};
s[366] = {l: 'Любен Каравелов', n: 'ОУ Любен Каравелов', b: [null, 45.11, 72.08, 70.99], m: [null, 52.08, 59.24, 56.77]};
s[367] = {l: 'Отец Паисий', n: 'ОУ Отец Паисий', b: [null, 39.30, 63.89, 64.57], m: [null, 38.23, 37.99, 44.57]};
s[368] = {l: 'СУЕЕ', n: 'СУ за европейски езици', b: [null, 42.00, 70.33, 70.58], m: [null, 40.06, 52.08, 48.33]};
s[369] = {l: 'СУПНЕ', n: 'СУПНЕ Фридрих Шилер', b: [null, 40.09, 63.73, 65.04], m: [null, 38.19, 48.14, 43.26]};
s[370] = {l: 'Тома Кърджиев', n: 'ОУ Тома Кърджиев', b: [null, 31.99, 55.58, 44.48], m: [null, 27.00, 36.35, 29.76]};

s[376] = {l: 'Леонардо да Винчи', n: 'ПЧСУ Леонардо да Винчи', b: [null, 31.73, 67.32, 60.22], m: [null, 26.33, 45.74, 37.34]};

// Стара Загора
s[381] = {l: 'ППМГ', n: 'ППМГ Гео Милев', b: [null, 52.34, 89.45, 81.60], m: [null, 58.70, 79.62, 81.82]};
s[382] = {l: '2 ОУ', n: '2 ОУ Петко Р. Славейков', b: [null, 45.17, 79.73, 71.69], m: [null, 41.32, 51.64, 55.15]};
s[383] = {l: '4 ОУ', n: '4 ОУ Кирил Христов', b: [null, 40.88, 69.75, 64.65], m: [null, 37.49, 47.50, 46.71]};
s[384] = {l: '5 ОУ', n: '5 ОУ Митьо Станев', b: [null, 41.29, 70.42, 67.85], m: [null, 37.62, 45.23, 49.56]};
s[385] = {l: '6 ОУ', n: '6 ОУ Св. Никола', b: [null, 44.21, 74.82, 69.83], m: [null, 40.46, 43.93, 55.63]};
s[386] = {l: '9 ОУ', n: '9 ОУ Веселин Ханчев', b: [null, 39.76, 57.03, 57.54], m: [null, 34.39, 29.06, 34.00]};
s[387] = {l: 'Васил Левски', n: 'СУ Васил Левски', b: [null, 37.10, 71.87, 59.45], m: [null, 29.60, 41.39, 39.13]};
s[388] = {l: 'Железник', n: 'СУ Железник', b: [null, 37.80, 56.87, 56.64], m: [null, 29.14, 24.87, 37.84]};
s[389] = {l: 'Иван Вазов', n: 'СУ Иван Вазов', b: [null, 35.05, 59.79, 55.57], m: [null, 30.00, 29.73, 34.95]};
s[390] = {l: 'Максим Горки', n: 'СУ Максим Горки', b: [null, 46.83, 77.57, 66.37], m: [null, 44.69, 51.14, 42.49]};

s[396] = {l: 'Елин Пелин', n: 'ЧОУ Елин Пелин', b: [null, 40.03, 76.98, 66.08], m: [null, 40.82, 59.07, 44.63]};

// Плевен
s[401] = {l: 'МГ Гео Милев', n: 'МГ Гео Милев', b: [null, 50.41, 79.76, 75.55], m: [null, 60.78, 73.61, 73.48]};
s[402] = {l: 'Ан. Димитрова', n: 'СУ Анастасия Димитрова', b: [null, 18.37, 36.05, 33.97], m: [null, 17.32, 11.59, 20.20]};
s[403] = {l: 'Валери Петров', n: 'ОУ Валери Петров', b: [null, 43.66, 75.83, 74.10], m: [null, 38.36, 39.53, 42.49]};
s[404] = {l: 'Васил Левски', n: 'ОУ Васил Левски', b: [null, 28.38, null, 45.17], m: [null, 20.08, null, 23.41]};
s[405] = {l: 'Иван Вазов', n: 'СУ Иван Вазов', b: [null, 40.43, 72.19, 66.10], m: [null, 40.40, 38.36, 44.82]};
s[406] = {l: 'Йордан Йовков', n: 'ОУ Йордан Йовков', b: [null, 31.89, 51.42, 55.01], m: [null, 27.77, 22.09, 27.58]};
s[407] = {l: 'Кл. Охридски', n: 'ОУ Св. Климент Охридски', b: [null, 27.28, 52.70, 47.50], m: [null, 19.42, 18.74, 22.74]};
s[408] = {l: 'Лазар Станев', n: 'ОУ Лазар Станев', b: [null, 32.50, 52.13, 42.82], m: [null, 35.94, 23.99, 25.29]};
s[409] = {l: 'Н. Вапцаров', n: 'ОУ Никола Вапцаров', b: [null, 20.44, 24.33, 6.55], m: [null, 31.50, 18.83, 13.44]};
s[410] = {l: 'Панайот Пипков', n: 'НУИ Панайот Пипков', b: [null, 38.65, 56.30, 60.04], m: [null, 26.44, 29.45, 25.45]};
s[411] = {l: 'Пейо Яворов', n: 'СУ Пейо Яворов', b: [null, 28.29, 45.83, 48.32], m: [null, 16.95, 19.37, 22.17]};
s[412] = {l: 'Петър Берон', n: 'ОУ Д-р Петър Берон', b: [null, 35.76, 59.82, 52.92], m: [null, 24.42, 24.81, 29.01]};
s[413] = {l: 'Спортното', n: 'Сп.У Георги Бенковски', b: [null, 26.24, 33.73, 29.95], m: [null, 23.55, 12.84, 14.97]};
s[414] = {l: 'Стоян Заимов', n: 'СУ Стоян Заимов', b: [null, 35.65, 63.35, 56.76], m: [null, 24.66, 26.61, 27.16]};
s[415] = {l: 'Хр. Смирненски', n: 'СУ Христо Смирненски', b: [null, 20.91, 37.88, 35.92], m: [null, 18.12, 11.40, 16.08]};
s[416] = {l: 'Цветан Спасов', n: 'ОУ Цветн Спасов', b: [null, 36.15, 66.76, 60.98], m: [null, 33.42, 36.07, 33.58]};

// Сливен
s[421] = {l: 'ППМГ', n: 'ППМГ Добри Чинтулов', b: [null, 50.65, 84.44, 82.14], m: [null, 51.09, 66.93, 71.02]};
s[422] = {l: 'Димитър Петров', n: 'ОУ Димитър Петров', b: [null, 34.64, 55.49, 52.70], m: [null, 29.79, 26.94, 29.46]};
s[423] = {l: 'Ел. Багряна', n: 'ОУ Елисавета Багряна', b: [null, 34.31, 61.08, 56.54], m: [null, 31.22, 24.71, 32.94]};
s[424] = {l: 'Иван Селимински', n: 'ОУ Д-р Иван Селимински', b: [null, 39.94, 73.60, 70.01], m: [null, 37.00, 41.81, 47.62]};
s[425] = {l: 'Йордан Йовков', n: 'СУ Йордан Йовков', b: [null, 35.61, 51.68, 56.72], m: [null, 27.87, 21.87, 31.55]};
s[426] = {l: 'К. Константинов', n: 'СУ К. Константинов', b: [null, 32.76, 55.55, 54.29], m: [null, 27.18, 31.56, 33.57]};
s[427] = {l: 'Кирил и Методий', n: 'ОУ Кирил и Методий', b: [null, 28.08, 52.19, 49.94], m: [null, 24.60, 28.88, 36.19]};
s[428] = {l: 'Панайот Хитов', n: 'ОУ Панайот Хитов', b: [null, 33.66, 62.25, 39.08], m: [null, 37.05, 37.35, 22.76]};
s[429] = {l: 'Пейо Яворов', n: 'СУ Пейо Яворов', b: [null, 30.55, 55.49, 50.78], m: [null, 27.98, 28.88, 27.26]};
s[430] = {l: 'Христо Ботев', n: 'ОУ Христо Ботев', b: [null, 34.09, 55.56, 61.88], m: [null, 26.87, 30.40, 43.58]};

// Добрич
s[441] = {l: 'ПМГ Иван Вазов', n: 'ПМГ Иван Вазов', b: [null, 43.82, 75.63, 59.98], m: [null, 42.65, 30.40, 46.82]};
s[442] = {l: 'Димитър Талев', n: 'СУ Димитър Талев', b: [null, 35.05, 56.46, 54.26], m: [null, 24.66, 28.75, 30.27]};
s[443] = {l: 'Кирил и Методий', n: 'СУ Кирил и Методий', b: [null, 35.69, 62.21, 59.51], m: [null, 31.08, 32.88, 36.83]};
s[444] = {l: 'Климент Охридски', n: 'СУ Св. Климент Охридски', b: [null, 33.66, 56.10, 58.79], m: [null, 26.02, 26.60, 38.62]};
s[445] = {l: 'Любен Каравелов', n: 'СУ Любен Каравелов', b: [null, 29.55, 63.74, 45.23], m: [null, 25.70, 28.96, 24.40]};
s[446] = {l: 'Панайот Волов', n: 'ОУ Панайот Волов', b: [null, 20.61, 29.10, 10.74], m: [null, 24.00, 26.72, 20.32]};
s[447] = {l: 'Петко Славейков', n: 'СУ Петко Славейков', b: [null, 41.84, 66.60, 73.13], m: [null, 39.92, 38.74, 54.76]};
s[448] = {l: 'Стефан Караджа', n: 'ОУ Стефан Караджа', b: [null, 33.40, 48.63, 36.19], m: [null, 27.96, 19.93, 24.00]};
s[449] = {l: 'Хан Аспарух', n: 'ОУ Хан Аспарух', b: [null, 40.68, 68.50, 64.72], m: [null, 39.63, 34.51, 37.28]};
s[450] = {l: 'Христо Ботев', n: 'ОУ Христо Ботев', b: [null, 35.40, 60.43, 58.69], m: [null, 40.04, 36.90, 44.89]};

s[456] = {l: 'Мария Монтесори', n: 'ЧОУ Мария Монтесори', b: [null, null, 57.19, 66.75], m: [null, null, 31.28, 43.94]};
s[457] = {l: 'Леонардо да Винчи', n: 'ЧСУ Леонардо да Винчи', b: [null, 37.25, 62.05, 57.31], m: [null, 23.00, 29.73, 39.00]};

// Шумен
s[461] = {l: 'ППМГ', n: 'ППМГ Нанчо Попович', b: [null, 52.49, 80.50, 81.07], m: [null, 56.11, 66.39, 75.82]};
s[462] = {l: 'Васил Левски', n: 'СУ Васил Левски', b: [null, 33.64, 47.17, 45.75], m: [null, 25.54, 25.55, 26.62]};
s[463] = {l: 'Димитър Благоев', n: 'ОУ Димитър Благоев', b: [null, 39.80, 53.98, 58.14], m: [null, 30.43, 22.98, 32.19]};
s[464] = {l: 'Еньо Марковски', n: 'ОУ Еньо Марковски', b: [null, 13.64, 17.50, 24.89], m: [null, 11.63, 12.89, 13.06]};
s[465] = {l: 'Йоан Екзарх', n: 'СУ Йоан Екзарх Български', b: [null, 36.36, 54.13, 56.66], m: [null, 30.69, 23.07, 33.71]};
s[466] = {l: 'Панайот Волов ОУ', n: 'ОУ Панайот Волов', b: [null, 25.97, 49.39, 42.68], m: [null, 23.43, 25.77, 24.18]};
s[467] = {l: 'Панайот Волов СУ', n: 'СУ Панайот Волов', b: [null, 28.79, 47.49, 52.36], m: [null, 27.02, 19.48, 28.45]};
s[468] = {l: 'Петър Берон', n: 'ОУ Д-р Петър Берон', b: [null, 33.38, 53.98, 52.02], m: [null, 25.15, 30.13, 33.82]};
s[469] = {l: 'Сава Доброплодни', n: 'СУ Сава Доброплодни', b: [null, 39.91, 68.46, 63.77], m: [null, 32.38, 33.80, 39.59]};
s[470] = {l: 'Трайко Симеонов', n: 'СУ Трайко Симеонов', b: [null, 20.90, 34.11, 13.50], m: [null, 22.42, 28.63, 11.65]};

// Перник
s[471] = {l: 'ПМГ Хр. Смирненски', n: 'ПМГ Христи Смирненски', b: [null, null, 84.79, 75.03], m: [null, null, 87.89, 71.19]};
s[472] = {l: '6 ОУ', n: '6 ОУ Кирил и Методий', b: [null, 24.37, 48.06, 45.87], m: [null, 16.29, 21.56, 25.85]};
s[473] = {l: '7 ОУ', n: '7 ОУ Георги С. Раковски', b: [null, 29.70, 46.77, 38.91], m: [null, 22.86, 23.99, 21.00]};
s[474] = {l: '10 ОУ', n: '10 ОУ Ал. Константинов', b: [null, 35.09, 60.98, 56.36], m: [null, 31.08, 33.29, 35.85]};
s[475] = {l: '11 ОУ', n: '11 ОУ Елин Пелин', b: [null, 35.67, 63.14, 56.15], m: [null, 33.99, 32.86, 30.82]};
s[476] = {l: '12 ОУ', n: '12 ОУ Васил Левски', b: [null, 34.04, 56.61, 51.91], m: [null, 33.30, 27.83, 30.06]};
s[477] = {l: '13 ОУ', n: '13 СУ Кирил и Методий', b: [null, 30.29, 56.61, 46.98], m: [null, 23.10, 32.27, 24.65]};
s[478] = {l: '16 ОУ', n: '16 ОУ Гр. Перник', b: [null, 33.68, 60.52, 61.35], m: [null, 27.97, 24.16, 25.36]};
s[479] = {l: 'Иван Рилски', n: 'ОУ Св. Иван Рилски', b: [null, 40.53, 72.36, 62.20], m: [null, 36.12, 35.97, 36.61]};
s[480] = {l: 'СУРИЧЕ', n: 'СУРИЧЕ Д-р Петър Берон', b: [null, 39.19, 67.06, 63.02], m: [null, 33.05, 32.47, 30.87]};

// Хасково
s[481] = {l: 'ПМГ Б. Петканчин', n: 'ПМГ Акад. Б. Петканчин', b: [null, 48.61, 84.16, 81.86], m: [null, 58.00, 84.69, 80.71]};
s[482] = {l: 'Васил Левски', n: 'СУ Васил Левски', b: [null, 30.57, 56.06, 48.33], m: [null, 29.23, 31.40, 29.81]};
s[483] = {l: 'Иван Рилски', n: 'ОУ Св. Иван Рилски', b: [null, 37.61, 63.98, 63.57], m: [null, 34.05, 34.29, 45.54]};
s[484] = {l: 'Кирил и Методий', n: 'ОУ Кирил и Методий', b: [null, 31.08, 44.88, 40.71], m: [null, 30.05, 24.58, 26.27]};
s[485] = {l: 'Климент Охридски', n: 'ОУ Св. Климент Охридски', b: [null, 43.08, 64.74, 72.59], m: [null, 41.21, 41.34, 57.60]};
s[486] = {l: 'Любен Каравелов', n: 'ОУ Любен Каравелов', b: [null, 37.09, 60.53, 58.99], m: [null, 37.00, 37.32, 36.47]};
s[487] = {l: 'Никола Вапцаров', n: 'ОУ Никола Вапцаров', b: [null, 15.68, 12.12, 17.65], m: [null, 19.93, 18.69, 21.82]};
s[488] = {l: 'П. Хилендарски', n: 'СУ Св. П. Хилендарски', b: [null, 30.76, 56.43, 52.90], m: [null, 25.85, 28.17, 30.02]};
s[489] = {l: 'Хр. Смирненски', n: 'ОУ Христо Смирненски', b: [null, 37.27, 59.39, 60.88], m: [null, 31.45, 31.92, 40.53]};
s[490] = {l: 'Шандор Петьофи', n: 'ОУ Шандор Петьофи', b: [null, 35.73, 40.46, 46.16], m: [null, 22.49, 18.47, 24.63]};

// Ямбол
s[491] = {l: 'ПМГ А. Радев', n: 'ПМГ Атанас Радев', b: [null, 42.28, 79.28, 70.66], m: [null, 50.14, 71.47, 64.47]};
s[492] = {l: 'Йордан Йовков', n: 'ОУ Йордан Йовков', b: [null, 16.90, 15.83, 24.47], m: [null, 27.61, 31.76, 21.18]};
s[493] = {l: 'Климент Охридски', n: 'СУ Св. Климент Охридски', b: [null, 30.93, 44.77, 42.00], m: [null, 24.04, 18.85, 22.12]};
s[494] = {l: 'Любен Каравелов', n: 'ОУ Любен Каравелов', b: [null, 37.97, 61.84, 59.85], m: [null, 38.45, 37.15, 33.05]};
s[495] = {l: 'Николай Петрини', n: 'ОУ Николай Петрини', b: [null, 35.86, 54.93, 48.10], m: [null, 29.93, 28.60, 27.93]};
s[496] = {l: 'Петко Славейков', n: 'ОУ Петко Славейков', b: [null, 30.10, 51.89, 50.95], m: [null, 22.69, 22.60, 31.41]};
s[497] = {l: 'Петър Берон', n: 'ОУ Д-р Петър Берон', b: [null, 20.10, 16.94, 23.26], m: [null, 26.56, 23.71, 34.66]};
s[498] = {l: 'Пиер дьо Кубертен', n: 'СУ Пиер дьо Кубертен', b: [null, 19.03, 25.02, 30.07], m: [null, 11.88, 15.52, 20.64]};
s[499] = {l: 'Хр. Смирненски', n: 'ОУ Христо Смирненски', b: [null, 13.16, 27.29, 16.28], m: [null, 12.67, 29.48, 20.98]};

// Пазарджик
s[501] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Благоевград
s[511] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Велико Търново
s[521] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Враца
s[531] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Габрово
s[541] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Видин
s[551] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Монтана
s[561] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Кюстендил
s[571] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Кърджали
s[581] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Търговище
s[591] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Ловеч
s[601] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Силистра
s[611] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Разград
s[621] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};

// Смолян
s[631] = {l: 'TODO', n: 'TODO', b: [null, null, null, null], m: [null, null, null, null]};
