Конвертирует базу данных бэкапов приложения `1Money` (https://play.google.com/store/apps/details?id=org.pixelrush.moneyiq)

Для извлечения данных нужно взять бэкап из сотового взять крайний бэкап .bak из директории
`/Android/data/org.pixelrush.moneyiq/files/1Money/backup`
с помощью `DB Browser (SQLite)` (https://sqlitebrowser.org/)
сконвертировать бэкап в папку с даннымы в json формате

Указать в .env.local

`DATABASE_DIRECTORY=`путь до папки с даннымы в json формате

`FROM_DATE=`дата начала периода (формат ISO 8601, пример 2024-03-08T10:47:11.554Z)

`TO_DATE=`дата конца периода (формат ISO 8601)

`OUTPUT_PATH=`путь до файла для выгрузки

`OUTPUT_FORMAT=`CSV или JSONLINES

Пример
```
DATABASE_DIRECTORY=C:/Users/LIS355/Desktop/b/json
FROM_DATE="2024-02-01T10:00:00.000Z"
TO_DATE="2024-03-01T10:00:00.000Z"
OUTPUT_PATH=C:/Users/LIS355/Desktop/b/json/out.csv
OUTPUT_FORMAT=CSV
```
