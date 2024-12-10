const lessons = [ 1, 2, 3, 4, 5, 6, 7 ];

const constructorTemplate = Handlebars.compile( $("#schedule-constructor").html() );

const anchor = $("#anchor");
const pointer = $("#pointer");

let group = null;

function weekdays() {
    schedule.weekdays = {};
    monday.setDate(monday.getDate() - monday.getDay() + 1)

    for (let d = 0; d < 7; d++) {
        let date = new Date(monday.getTime());
        let day = d + 1;
        date.setDate(date.getDate() + d);

        schedule.weekdays[day] = { };
        
        schedule.weekdays[day].name = date.toLocaleString('ru', {  weekday: 'long' })
        schedule.weekdays[day].name = schedule.weekdays[day].name.replace(/^./, schedule.weekdays[day].name[0].toUpperCase());
        schedule.weekdays[day].day = date.toLocaleString('ru', {  day: '2-digit' });
        schedule.weekdays[day].month = date.toLocaleString('ru', {  month: '2-digit' });
        schedule.weekdays[day].year = date.toLocaleString('ru', {  year: 'numeric' });

        $(`.date[data-weekday="${day}"]`).html(`${schedule.weekdays[day].month}.${schedule.weekdays[day].day}.${schedule.weekdays[day].year}`);
    }
    
    $(".date-header").html(`Расписание замены занятий с ${schedule.weekdays[1].day}.${schedule.weekdays[1].month}.${schedule.weekdays[1].year} г. по ${schedule.weekdays[5].day}.${schedule.weekdays[5].month}.${schedule.weekdays[5].year} г.`);
}

/**
 * Функции кнопок в шапке и подвале
 */

$("#new-schedule").click(function() {
    renameSchedule();

    window.location.reload();
})

$("#export-schedule").click(function() {
    let book = null;

    $(".schedule-sheet").each(function(index) {
        let name = `${this.dataset.name[0]} (${(index + 1)})`;

        switch (book) {
            case null:
                book = TableToExcel.tableToBook(this, {
                    sheet:{name: name}
                });
                break;
            default:
                TableToExcel.tableToSheet(book, this, {
                    sheet:{name: name}
                });
                break;
        }
    });

    $("#teachers, #cabinets").each(function() {
        switch (book) {
            case null:
                book = TableToExcel.tableToBook(this, {
                    sheet:{name: this.dataset.name}
                });
                break;
            default:
                TableToExcel.tableToSheet(book, this, {
                    sheet:{name: this.dataset.name}
                });
                break;
        }
    });

    TableToExcel.save(book, "schedule2.xlsx");
});

$("#prev-week").click(function() {
    let day = monday.getDate() - 7;
    monday.setDate(day);

    weekdays();
});

$("#next-week").click(function() {
    let day = monday.getDate() + 7;
    monday.setDate(day);

    weekdays();
});

$("#to-editor").click(function() {
    window.location.replace("../editor/index.html");
});

/**
 * Создание элемента расписания
 */
function createScheduleElement(type, weekday, lesson, part, group, id, linked) {
    let currentId = schedule.schedule.next_id;

    schedule.schedule.list[currentId] = {
        type: type,
        weekday: Number(weekday),
        lesson: Number(lesson),
        part: Number(part),
        group: Number(group),
        id: Number(id)
    };

    if (linked != null) schedule.schedule.list[currentId].linked = Number(linked);

    schedule.schedule.next_id++;

    scheduleElementPlacing(currentId); // помещаем элемент в таблицы

    // Подстановка связанных с текущим элементом элементов в зависимости от типа
    switch (type) {
        case "s":
            let teachers = [...data.groups.list[group].subjects[id].teachers];

            /**
             * В зависимости от того, чётное или нечётное 
             * количество преподавателей в группе - разное поведение.
             * Чётное - то берётся первая или вторая половина из списка.
             * Нечётное - без изменений, подставляются все преподаватели.
             **/
            switch (part) {
                case "1":
                    if ((teachers.length % 2) == 0) teachers = teachers.slice(0, -(teachers.length / 2));
                    break;
                case "2":
                    if ((teachers.length % 2) == 0) teachers = teachers.slice((teachers.length / 2));
                    break;
                default:
                    break;
            }
            
            for (var teacher of teachers) {
                if (teacher != null) createScheduleElement("t", weekday, lesson, part, group, teacher, currentId);

            }
            break;
        case "t":
            let cabinet = data.teachers.list[id].cabinet;
            if (cabinet != null) createScheduleElement("c", weekday, lesson, part, group, cabinet, currentId);
            break;
    }

    saveSchedule();
}

// Подстановка в ячейки таблиц элемент раписания
function scheduleElementPlacing(id) {
    let values = { ...schedule.schedule.list[id] };
    let linked = "";            // доп. параметр, если он прикреплён к другому элементу (к примеру, кабинет к преподавателю)
    let scheduleCell = "";      // query-селектор ячейки в основной таблице (экспортируемой в Excel)
    let scheduleElement = "";   // текст создаваемого элемента в основной таблице (экспортируемой в Excel)
    let elementCells = "";      // query-селектор ячейки в вспомогательной таблице
    let element = "";           // текст создаваемого элемента вспомогательной таблице
    values.elementText = data.groups.list[values.group].name;

    if ("linked" in values) linked += ` data-linked="${values.linked}"`;

    switch (values.type) {
        case "s":
            values.scheduleText = data.subjects.list[values.id].title;
            values.elementText = "+";

            if (values.part != 0) values.scheduleText += ` ${values.part}п`;

            elementCells = `#subjects [data-group="${values.group}"][data-weekday="${values.weekday}"][data-lesson="${values.lesson}"][data-type="${values.type}"][data-part="${values.part}"][data-subject="${values.id}"]`;
            break;
        case "t":
            values.scheduleText = data.teachers.list[values.id].fio;

            elementCells = `#teachers [data-weekday="${values.weekday}"][data-lesson="${values.lesson}"][data-type="${values.type}"][data-teacher="${values.id}"] [data-part="${values.part}"]`;
            break;
        case "c":
            values.scheduleText = data.cabinets.list[values.id].number;

            elementCells = `#cabinets [data-weekday="${values.weekday}"][data-lesson="${values.lesson}"][data-type="${values.type}"][data-cabinet="${values.id}"] [data-part="${values.part}"]`;
            break;
    }

    scheduleCell = `.schedule-sheet [data-group="${values.group}"][data-weekday="${values.weekday}"][data-lesson="${values.lesson}"][data-type="${values.type}"] [data-part="${values.part}"]`;

    scheduleElement = `<div class="schedule-element" data-id="${id}"${linked}>${values.scheduleText} </div>`;

    element = `<div class="schedule-element" data-id="${id}"${linked}>${values.elementText} </div>`;

    $(scheduleCell)
        .append(scheduleElement);

    $(elementCells)
        .append(element);
}

// Удаление элемента расписания 
function scheduleElementDeplacing(id) {
    let values = { ...schedule.schedule.list[id] };

    switch (values.type) {
        case "s":
            $(`.schedule-element[data-linked="${id}"]`).each(function() {
                scheduleElementDeplacing(this.dataset.id);
            });
            break;
        case "t":
            $(`.schedule-element[data-linked="${id}"]`).each(function() {
                scheduleElementDeplacing(this.dataset.id);
            });
            break;
    }

    $(`.schedule-element[data-id="${id}"]`).remove();
    delete schedule.schedule.list[id];

    saveSchedule();
}

// Клик по ячейками основной таблицы, выбор группы и открытие списка его дисциплин
main.on("click", ".schedule-sheet td", function() {
    if ("group" in this.dataset) {
        group = this.dataset.group;

        $(`.header-group[data-group="${group}"]`).append(anchor);
        $(`.display[data-group="${group}"]`).append(pointer);
    }
});

// Клик по элементу расписания и его удаление с основной таблицы
main.on("click", ".schedule-sheet .schedule-element", function() {
    if ("id" in this.dataset) {
        scheduleElementDeplacing(this.dataset.id);
    }
});

// Выбор кабинета для выбранной группы путём нажатия на ячейку вспомогательной таблицы
main.on("click", "#cabinets td", function() {
    if (group != null) {
        createScheduleElement("c", this.dataset.weekday, this.dataset.lesson, 0, group, this.dataset.cabinet);
    }
});

// Выбор преподавателя для выбранной группы путём нажатия на ячейку вспомогательной таблицы
main.on("click", "#teachers td", function() {
    if (group != null) {
        createScheduleElement("t", this.dataset.weekday, this.dataset.lesson, 0, group, this.dataset.teacher);
    }
});

// Выбор дисциплины для выбранной группы путём нажатия на ячейку вспомогательной таблицы
main.on("click", "#subjects td", function() {
    if (group != null) {
        createScheduleElement("s", this.dataset.weekday, this.dataset.lesson, this.dataset.part, group, this.dataset.subject);
    }
});

// Исключение/добавление дня недели к расписанию при клике по назвпнию дня недели или её дате
main.on("click", ".weekday-excluding", function() {
    let weekday = this.dataset.weekday;
    let bool = !(String(this.parentNode.dataset.exclude).toLowerCase() === "true");

    $(`.schedule-sheet tr[data-weekday="${weekday}"]`).attr("data-exclude", bool);
});

// !important загрузка данных и рабочей области
eel.upload_data()(function(json) {
    let result = JSON.parse(json);
    data = result;

    eel.upload_schedule()(function(json) {
        let result = JSON.parse(json);
        schedule = result;

        if ("weekdays" in schedule) monday = new Date(`${schedule.weekdays[1].month}/${schedule.weekdays[1].day}/${schedule.weekdays[1].year}`);
        
        weekdays();

        main.html(constructorTemplate({...data, lessons, ...schedule})); // !important загрузка рабочей области

        // !important загрузка элементов текущего расписания
        for (var index in schedule.schedule.list) {
            let values = {...schedule.schedule.list[index]};
        
            let isValid = false;
        
            // проверка на существование данных элемента
            if (values.group in data.groups.list) {
                switch (values.type) {
                    case "s":
                        isValid = (values.id in data.subjects.list);
                        break;
                    case "t":
                        isValid = (values.id in data.teachers.list);
                        break;
                    case "c":
                        isValid = (values.id in data.cabinets.list);
                        break;
                }
            }
            
            if (isValid) scheduleElementPlacing(index)
            else delete schedule.schedule.list[index];
        }
    });
});