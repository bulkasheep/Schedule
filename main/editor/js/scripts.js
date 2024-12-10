const formTemplate = Handlebars.compile( $("#data-form").html() );

const editorTemplate = Handlebars.compile( $("#data-editor").html() );

const sheetsTemplate = Handlebars.compile( $("#sheets-list").html() );

let context = {};
/**
 * Функции кнопок в шапке и подвале
 */

$("#to-constructor").click(function() {
    window.location.replace("../constructor/index.html");
});

//  Форма для редактирования данных
function toForm(values) {
    main.html("");
    main.html(formTemplate({...data, values}))
}

//  Список Excel-страниц и групп в них
function toSheetsList() {
    main.html("");
    main.html(sheetsTemplate(data));
    $("#list ul").sortable({
        handle: ".handle",
        connectWith: "#list ul",
        update: refreshSheets
    });
}

//  К спискам всех данных ждя навигации
function toEditor() {
    main.html("");
    main.html(editorTemplate(data));
}

//  Перезапись data.sheets актуальными данными
function refreshSheets() {
    let sheets = {list: []};
    $("main #list > li").each(function() {
        let title = this.querySelector(".title").innerHTML;
        let groups = [];

        $(this).find(".group").each(function() {
            let id = Number(this.dataset.group);
            let name = this.querySelector(".name").innerHTML;

            groups.push(id);
            data.groups.list[id].name = name;
        });

        sheets.list.push({
            title: title,
            groups: groups
        });
    });
    
    data.sheets = sheets;

    saveData();
} 

/**
 * Добавляем, редактируем и удаляем
 * дисциплины
 */

/**
 *  Добавление дисциплины
 *  !!! автоматически создаёт новый элемент
 */
main.on("click", "#new-subject", function() {
    context = {
        type: "subject",
        subject: {
            id: data.subjects.next_id
        }
    };
    toForm(context);

    data.subjects.list[context.subject.id] = { title: "" };
    data.subjects.next_id++;

    saveData();
});

//  Динамическое сохранение изменений в названии дисциплины
main.on("input", "#title", function() {
    let id = Number(context.subject.id);

    data.subjects.list[id].title = this.value;

    saveData();
});

//  Удаление дисциплины на кнопку "Удалить"
main.on("click", "#subject #delete", function() {
    let id = Number(context.subject.id);

    delete data.subjects.list[id];

    //  Открепляем её от связанных групп
    for (var g in data.groups.list) {
        delete data.groups.list[g].subjects[id];
    }
    
    toEditor();

    saveData();
});

/**
 * Добавляем и удаляем
 * преподавателей дисциплины в группе
 */

//  Открепление преподавателя от дисциплины группы
main.on("click", ".delete-teacher", function() {
    let group = Number(context.teachers.group);
    let subject = Number(context.teachers.subject);

    let id = Number(this.parentNode.dataset.teacher);
    let index = data.groups.list[group].subjects[subject].teachers.indexOf(id);

    data.groups.list[group].subjects[subject].teachers[index] = null;

    this.parentNode.remove();

    saveData();
});

//  Добавление выбранного из списка преопдавателя дисциплине группы
main.on("change input", "#teacher-list", function() {
    let group = Number(context.teachers.group);
    let subject = Number(context.teachers.subject);

    data.groups.list[group].subjects[subject].teachers.push(Number(this.value));

    toForm(context);

    saveData();
});

//  Открепление дисциплины от группы вместе с преподавателями на кнопку "Удалить"
main.on("click", "#teachers #delete", function() {
    let group = Number(context.teachers.group);
    let subject = Number(context.teachers.subject);

    delete data.groups.list[group].subjects[subject];

    toEditor();

    saveData();
});

/**
 * Добавляем, редактируем и удаляем
 * преподавателя
 */

/**
 *  Добавление преподавателя
 *  !!! автоматически создаёт новый элемент
 */
main.on("click", "#new-teacher", function() {
    context = {
        type: "teacher",
        teacher: {
            id: data.teachers.next_id
        }
    };
    toForm(context);

    data.teachers.list[context.teacher.id] = { fio: "", cabinet: null };
    data.teachers.next_id++;

    saveData();
});

//  Динамическое сохранение изменений в ФИО
main.on("input", "#fio", function() {
    let id = Number(context.teacher.id);

    data.teachers.list[id].fio = this.value;

    saveData();
});

//  Прикрепление выбранного из списка кабинета к преподавателю
main.on("change input", "#cabinet-list", function() {
    let id = Number(context.teacher.id);

    data.teachers.list[id].cabinet = this.value;

    saveData();
});

//  Удаление преподавателя на кнопку "Удалить"
main.on("click", "#teacher #delete", function() {
    let id = Number(context.teacher.id);

    delete data.teachers.list[id];

    for (var g in data.groups.list) {
        for (var s in data.groups.list[g].subjects) {

            let index = data.groups.list[g].subjects[s].teachers.indexOf(id);
    
            if (index !== -1) data.groups.list[g].subjects[s].teachers[index] = null;
        }
    }

    toEditor();

    saveData();
});

/**
 * Добавляем, редактируем и удаляем
 * кабинет
 */

/**
 *  Добавление кабинета
 *  !!! автоматически создаёт новый элемент
 */
main.on("click", "#new-cabinet", function() {
    context = {
        type: "cabinet",
        cabinet: {
            id: data.cabinets.next_id
        }
    };
    toForm(context);

    data.cabinets.list[context.cabinet.id] = { number: "" };
    data.cabinets.next_id++;

    saveData();
});

//  Динамическое сохранение изменений в номере кабинета
main.on("input", "#number", function() {
    let id = Number(context.cabinet.id);

    data.cabinets.list[id].number = this.value;

    saveData();
});

//  Удаление кабинета на кнопку "Удалить"
main.on("click", "#cabinet #delete", function() {
    let id = Number(context.cabinet.id);

    delete data.cabinets.list[id];

    for (var t in data.teachers.list) {
        if (data.teachers.list[t].cabinet === id) data.teachers.list[t].cabinet = null;
    }
    
    toEditor();

    saveData();
});

// Кнопка "Вернуться"
main.on("click", "#return", function() {
    toEditor();
});

//  Переход к списку Excel-страниц с группами при клике по названию страницы
main.on("click", ".sheet", function() {
    toSheetsList();
});

//  Добавление новой Excel-страницы
main.on("click", "#new-sheet", function() {
    data.sheets.list.push({
        title: "Направление",
        groups: []
    });

    toSheetsList();
    document.querySelector("#new-sheet").scrollIntoView();

    saveData();
});

//  Динамическое сохранение изменений в названии страницы
main.on("input", ".title", function() {
    let index = Number(this.parentNode.dataset.sheet);

    data.sheets.list[index].title = this.innerHTML;

    saveData();
});

//  Удаление Excel-страницы и удаление всех групп в нём
main.on("click", ".delete-sheet", function() {
    let index = Number(this.parentNode.dataset.sheet);

    $(`[data-sheet="${index}"] .group`).each(function() {
        let id = Number(this.dataset.group);
        
        delete data.groups.list[id];
    });

    this.parentNode.remove();
    refreshSheets();
});

//  Добавление новой группы в Excel-странице (и вообще)
main.on("click", ".new-group", function() {
    let index = Number(this.parentNode.dataset.sheet);
    let id = Number(data.groups.next_id);
    data.groups.next_id++;

    data.sheets.list[index].groups.push(id);

    data.groups.list[id] = {
        name: "Группа",
        subjects: {}
    }

    toSheetsList();
    document.querySelector(`[data-sheet="${index}"] .new-group`).scrollIntoView();

    saveData();
});

//  Динамическое сохранение изменений в названии группы
main.on("input", ".name", function() {
    let id = Number(this.parentNode.dataset.group);

    data.groups.list[id].name = this.innerHTML;

    saveData();
});

//  Удаление группы
main.on("click", ".delete-group", function() {
    let id = Number(this.parentNode.dataset.group);

    this.parentNode.remove();
    delete data.groups.list[id];

    refreshSheets();
});

//  Переход к редактированию дисциплины при клике по ячейке-заголовку
main.on("click", ".subject", function() {
    context = {
        type: "subject",
        subject: {
            id: this.dataset.subject
        }
    };
    toForm(context);
});

//  Переход к редактированию преподавателей дисциплины группы при клике по ячейке
main.on("click", ".teachers", function() {
    context = {
        type: "teachers",
        teachers: {
            group: this.dataset.group,
            subject: this.dataset.subject
        }
    };
    toForm(context);
    
    if (!(context.teachers.subject in data.groups.list[context.teachers.group].subjects))
        data.groups.list[context.teachers.group].subjects[context.teachers.subject] = { teachers: [] };

    saveData();
});

//  Переход к редактированию преподавателя при клике по ячейке-заголовку
main.on("click", ".teacher", function() {
    context = {
        type: "teacher",
        teacher: {
            id: this.dataset.teacher
        }
    };
    toForm(context);
});

//  Переход к редактированию кабинета при клике по ячейке-заголовку
main.on("click", ".cabinet", function() {
    context = {
        type: "cabinet",
        cabinet: {
            id: this.dataset.cabinet
        }
    };
    toForm(context);
});

// !important загрузка данных рабочей области
eel.upload_data()(function(json) {
    let result = JSON.parse(json);
    data = result;
    toEditor();
});