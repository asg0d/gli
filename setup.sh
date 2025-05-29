#!/bin/bash

# Создание виртуального окружения
python -m venv venv

# Активация виртуального окружения (Linux/Mac)
source venv/bin/activate

# Для Windows используйте:
# venv\Scripts\activate

# Установка зависимостей
pip install -r requirements.txt

# Создание миграций
python manage.py makemigrations

# Применение миграций
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Запуск сервера разработки
python manage.py runserver
