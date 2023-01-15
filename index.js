require('dotenv').config()
const { default: puppeteer } = require("puppeteer");
const notifier = require('node-notifier');
const express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('.data/db.json');
const db = low(adapter);
const bodyparser = require('body-parser');    
const webpush = require('web-push');
const fs = require('fs');

db.defaults({
  subscriptions: []
}).write();


const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT
};

console.log(vapidDetails)

const app = express();

app.use(bodyparser.json());
app.use(express.static('frontend'));

function pushNotify(message) {
  const subscriptions = db.get('subscriptions').cloneDeep().value();
  // Create the notification content.
  const notification = JSON.stringify({
    title: "MUN Registration Bot",
    options: {
      body: `${message}`
    }
  });
  // Customize how the push service should attempt to deliver the push message.
  // And provide authentication information.
  const options = {
    TTL: 10000,
    vapidDetails: vapidDetails
  };
  
  if(subscriptions.length <= 0){
    return;
  }
  // Send a push message to each client specified in the subscriptions array.
  subscriptions.forEach(subscription => {
    const endpoint = subscription.endpoint;
    const id = endpoint.substr((endpoint.length - 8), endpoint.length);
    webpush.sendNotification(subscription, notification, options)
      .then(result => {
        console.log(`Endpoint ID: ${id}`);
        console.log(`Result: ${result.statusCode}`);
      })
      .catch(error => {
        console.log(`Endpoint ID: ${id}`);
        console.log(`Error: ${error} `);
      });
  });
}


app.post('/subscribe', (req, res) => {
    db.get('subscriptions')
      .push(req.body)
      .write();
    res.sendStatus(200);
});
const server = https.createServer({key: key, cert: cert}, app);

server.listen(443, () => {
  console.log('express running');
});

function randint(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function delay(time) {
  return new Promise(function(resolve) {
      setTimeout(resolve, time)
  });
}


async function goToPageOrLogin(page, url) {
  await page.goto(url)
  // If login requested
  if (page.url().includes('https://login.mun.ca')){
    await page.type('#username', 'zmehdee');
    await page.type('#password', 'BE.LeASEC39*nCH');
    await page.click(`button[name="submit"]`)
    await delay(randint(500,1000))
    await page.goto(url)
  }  
}

(async () => {
  const browser = await puppeteer.launch({headless:true});
  const page = await browser.newPage();
  while(true){
    try {
      
        await goToPageOrLogin(page, 'https://selfservice.mun.ca/admit/bwskfcls.P_GetCrse?term_in=202202&sel_subj=dummy&sel_subj=COMP&SEL_CRSE=2002&SEL_TITLE=&BEGIN_HH=0&BEGIN_MI=0&BEGIN_AP=a&SEL_DAY=dummy&SEL_PTRM=dummy&END_HH=0&END_MI=0&END_AP=a&SEL_CAMP=dummy&SEL_SCHD=dummy&SEL_SESS=dummy&SEL_INSTR=dummy&SEL_INSTR=%25&SEL_ATTR=dummy&SEL_ATTR=%25&SEL_LEVL=dummy&SEL_LEVL=%25&SEL_INSM=dummy&sel_dunt_code=&sel_dunt_unit=&call_value_in=&rsts=dummy&crn=dummy&path=1&SUB_BTN=View+Sections')
        //await delay(randint(500,1000))
        const remainingSeats2002 = await (await(await page.$('body > div.pagebodydiv > form > table > tbody > tr:nth-child(6) > td:nth-child(14)')).getProperty('textContent')).jsonValue();
        console.log('2002', remainingSeats2002)
    
        if(parseInt(remainingSeats2002) > 0){
          notifier.notify('2002 SEAT AVAILABLE!!!!');
          pushNotify('2001 SEAT AVAILABLE!!!!');
          await page.click('body > div.pagebodydiv > form > table > tbody > tr:nth-child(5) > td:nth-child(1) > input[type="checkbox"]');
          await page.click('body > div.pagebodydiv > form > table > tbody > tr:nth-child(6) > td:nth-child(1) > input[type="checkbox"]');
          await page.click('input[value="Register"]');
        }
  
    } catch (error) {
      console.error(error);
      console.log(Date());
      notifier.notify(`Bot stopped at ${Date()}`);
      pushNotify(`Bot stopped at ${Date()}`);
      await delay(5000)
    }
  }
  console.log(page.url());

  await browser.close();
})();   