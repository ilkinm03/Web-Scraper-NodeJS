const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const CronJob = require("cron").CronJob;

const start = async () => {
  const browser = await puppeteer.launch({
    timeout: 40000,
    // For virtual window
    headless: false,
  });
  const page = await browser.newPage();
  // Website URL you want to scrap
  await page.goto(
    "https://tap.az/elanlar/dasinmaz-emlak/obyektler-ve-ofisler",
    {
      waitUntil: "networkidle0",
      timeout: 0,
    }
  );
  // Auto Scroll function
  await page.evaluate(async () => {
    return await new Promise((resolve, reject) => {
      try {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight === 50000) {
            clearInterval(timer);
            resolve();
          }
        }, 400);
      } catch (error) {
        reject(error);
      }
    });
  });
  const products = await page.$$eval(
    // html elements you want to scrap
    ".endless-products .products-link",
    (elems) =>
      elems.map((elem) => {
        const elemText = elem.textContent;
        // return elemText (for purpose)
        return (
          elemText.substring(0, elemText.indexOf("N") + 1) +
          ", " +
          elemText.substring(elemText.indexOf("N") + 1, elemText.length)
        );
      })
  );
  // Write all data in `products.csv` file
  fs.writeFile("products.csv", products.join("\r\n"));
  await browser.close();
};

// Run start function every 12 hours
const job = new CronJob("* */12 * * *", start);
job.start();
