import eel
import pytils
import codecs
import os
import json

#
# Основная информация (об учителях, кабинетах, список названий дисциплин)
#
data_file = r'data\data.json'
schedule_file = r'data\schedule.json'
default_data = """{
    "cabinets": {
        "next_id": 1,
        "list": { }
    },
    "teachers": {
        "next_id": 1,
        "list": { }
    },
    "subjects": {
        "next_id": 1,
        "list": { }
    },
    "groups": {
        "next_id": 1,
        "list": { }
    },
    "sheets": {
        "list": [ ]
    }
}"""
default_schedule = """{
    "schedule": {
        "next_id": 1,
        "list": { }
    }
}"""

@eel.expose
def save_data(data):
    with codecs.open(os.path.abspath(data_file), 'w+', "utf_8_sig") as file:
        file.write(data)

@eel.expose
def upload_data():
    global default_data
    global data_file

    data = default_data

    if os.path.exists(data_file):
        with codecs.open(os.path.abspath(data_file), 'r+', "utf_8_sig") as file:
            data = file.read()
    else:
        save_data(data)
    
    return data

#
# Информация о расписании
#

@eel.expose
def save_schedule(schedule_data):
    with codecs.open(os.path.abspath(schedule_file), 'w+', "utf_8_sig") as file:
        file.write(schedule_data)

@eel.expose
def upload_schedule():
    global default_schedule
    global schedule_file

    schedule = default_schedule

    if os.path.exists(schedule_file):
        with codecs.open(os.path.abspath(schedule_file), 'r+', "utf_8_sig") as file:
            schedule = file.read()
    else:
        save_schedule(schedule)
    
    return schedule

@eel.expose
def rename_schedule():
    count = 1
    if os.path.exists(schedule_file):
        while os.path.exists(f"data/old_schedule_{count}.json"):
            count += 1
        os.rename(schedule_file, f"data/old_schedule_{count}.json")

#
#   Стартуем
#

if __name__ == '__main__':
    eel.init('main')
    eel.start('index.html', port=8080, cmdline_args=['--start-fullscreen'], shutdown_delay=60.0)