import { config as dotenv } from "dotenv-flow";
import ndapp from "ndapp";

dotenv();

/**
 * Конвертирует базу данных бэкапов приложения 1Money
 * https://play.google.com/store/apps/details?id=org.pixelrush.moneyiq
 *
 * Для извлечения данных нужно взять бэкап из сотового, с помощью DB Browser (SQLite) (https://sqlitebrowser.org/)
 * сконвертировать бэкап в папку с даннымы в json формате
 *
 * Указать в .env.local
 * DATABASE_DIRECTORY=путь до папки с даннымы в json формате
 * FROM_DATE=дата начала периода (формат ISO 8601, пример 2024-03-08T10:47:11.554Z)
 * TO_DATE=дата конца периода (формат ISO 8601)
 * OUTPUT_PATH=путь до файла для выгрузки
 * OUTPUT_FORMAT=CSV или JSONLINES
 *
 * Пример
 * DATABASE_DIRECTORY=C:/Users/LIS355/Desktop/b/json
 * FROM_DATE="2024-02-01T10:00:00.000Z"
 * TO_DATE="2024-03-01T10:00:00.000Z"
 * OUTPUT_PATH=C:/Users/LIS355/Desktop/b/json/out.csv
 * OUTPUT_FORMAT=CSV
 */

const CATEGORY_TRANSLATE = {
	"Transport": "Транспорт",
	"Groceries": "Продукты",
	"Restaurant": "Кафе",
	"Family": "Семья",
	"Хата": "Квартира",
	"Health": "Здоровье",
	"Leisure": "Развлечения",
	"Stuff": "Техника",
	"Shopping": "Покупки"
};

function parseDatabase(dbDirectory) {
	const tr = app.tools.json.load(app.path.join(dbDirectory, "tr.json"));

	const trDa = app.libs._.groupBy(tr, x => String(x._da) + String(x._id));
	const rtObjs = Object.values(trDa);

	const de = app.tools.json.load(app.path.join(dbDirectory, "de.json"));
	const deCache = app.libs._.groupBy(de, x => String(x._id) + String(x._b_i));

	const transactions = rtObjs.map(x => ({
		date: app.moment(x[0]._da).milliseconds(0).valueOf(),
		category: CATEGORY_TRANSLATE[deCache[String(x[0]._d_i) + String(x[0]._b_i)][0]._na],
		amount: Number(x[0]._a_m),
		comment: x[0]._co || undefined
	}));

	transactions.sort((x, y) => x.date - y.date);

	return transactions;
}

// https://jsonlines.org/
function toJSONLines(filePath, transactions) {
	app.fs.writeFileSync(filePath,
		transactions
			.map(x => ({
				...x,
				date: { "$date": app.moment(x.date).toISOString() }
			}))
			.map(JSON.stringify)
			.join(app.os.EOL)
	);
}

function toCSV(filePath, transactions) {
	app.fs.writeFileSync(filePath,
		[
			Object.keys(transactions[0]).join(","),
			...transactions.map(x => Object.values(x).join(","))
		].join(ndapp.os.EOL)
	);
}

ndapp(async () => {
	const transactions = parseDatabase(process.env.DATABASE_DIRECTORY);

	console.log(`Parsed ${transactions.length} transactions, from ${app.moment(app.libs._.first(transactions).date).toString()} to ${app.moment(app.libs._.last(transactions).date).toString()}`);

	const FROM_DATE = app.moment(process.env.FROM_DATE).valueOf();
	const TO_DATE = app.moment(process.env.TO_DATE).valueOf();
	const filteredTransactions = transactions.filter(x => x.date >= FROM_DATE &&
		x.date <= TO_DATE);

	console.log(`Filtered ${filteredTransactions.length} transactions, from ${app.moment(app.libs._.first(filteredTransactions).date).toString()} to ${app.moment(app.libs._.last(filteredTransactions).date).toString()}`);

	const OUTPUT_FORMAT = process.env.OUTPUT_FORMAT;
	const OUTPUT_PATH = process.env.OUTPUT_PATH;
	switch (OUTPUT_FORMAT) {
		case "CSV": toCSV(OUTPUT_PATH, filteredTransactions); break;
		case "JSONLINES": toJSONLines(OUTPUT_PATH, filteredTransactions); break;
		default: throw new Error(`Unknown output format ${OUTPUT_FORMAT}`);
	}

	console.log(`Written ${filteredTransactions.length} transactions to ${OUTPUT_PATH} in ${OUTPUT_FORMAT} format`);

	const ttmg = app.libs._.groupBy(filteredTransactions, x => x.category);
	const data = Object.values(ttmg).map(x => app.libs._.sum(x.map(x => x.amount)));
	const url = new URL("https://quickchart.io/chart");
	url.searchParams.set("v", "2.9.4");
	url.searchParams.set("bkg", "#ffffff");
	url.searchParams.set("c", JSON.stringify({
		type: "doughnut",
		data: {
			labels: Object.keys(ttmg),
			datasets: [{ data }]
		},
		options: {
			plugins: {
				doughnutlabel: {
					labels: [{ text: app.libs._.sum(data), font: { size: 35 } }]
				},
				datalabels: {
					display: true,
					align: "center",
					backgroundColor: "#ffffff",
					font: {
						size: 10
					}
				}
			}
		}
	}));

	console.log(url.href);
});
