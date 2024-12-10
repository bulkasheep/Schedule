const main = $("#main");

let data = "{}";
let schedule = "{}";

let monday = new Date();
console.log(monday);

function saveData() {
    let json = JSON.stringify(data);
    eel.save_data(json);
}

function saveSchedule() {
    let json = JSON.stringify(schedule);
    eel.save_schedule(json);
}

function renameSchedule() {
    eel.rename_schedule();
}