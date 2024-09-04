require("dotenv").config();
const { default: puppeteer } = require("puppeteer");
const notifier = require("node-notifier");


function randint(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function delay(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}

async function login(page) {
	await page.goto("https://login.mun.ca/cas/login");
	await page.type("#username", process.env.MUN_USERNAME);
	await page.type("#password", process.env.MUN_PASSWORD);
	await page.click(`button[type="submit"]`);
	await delay(1000);
}

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		args: ["--no-sandbox"],
	});
	const page = await browser.newPage();
	await login(page);
	while (true) {
		try {
			await page.goto(
				"https://selfservice.mun.ca/admit/bwckschd.p_disp_detail_sched?term_in=202401&crn_in=40789"
			);
			const remainingSeats = await (
				await (
					await page.$(
						"body > div.pagebodydiv > table:nth-child(1) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td:nth-child(4)"
					)
				).getProperty("textContent")
			).jsonValue();
			console.log(remainingSeats);
			if (parseInt(remainingSeats) > 0) {
				await page.goto(
					"https://selfservice.mun.ca/admit/bwskfcls.P_GetCrse?term_in=202401&sel_subj=dummy&sel_subj=COMP&SEL_CRSE=3200&SEL_TITLE=&BEGIN_HH=0&BEGIN_MI=0&BEGIN_AP=a&SEL_DAY=dummy&SEL_PTRM=dummy&END_HH=0&END_MI=0&END_AP=a&SEL_CAMP=dummy&SEL_SCHD=dummy&SEL_SESS=dummy&SEL_INSTR=dummy&SEL_INSTR=%25&SEL_ATTR=dummy&SEL_ATTR=%25&SEL_LEVL=dummy&SEL_LEVL=%25&SEL_INSM=dummy&sel_dunt_code=&sel_dunt_unit=&call_value_in=&rsts=dummy&crn=dummy&path=1&SUB_BTN=View%20Sections"
				);
				await page.click(
					'body > div.pagebodydiv > form > table > tbody > tr:nth-child(5) > td:nth-child(1) > input[type="checkbox"]'
				);
				await page.click('input[value="Register"]');
			}
		} catch (error) {
			console.error(error);
			console.log(Date());
			await delay(5000);
		}
	}
	console.log(page.url());

	await browser.close();
})();
