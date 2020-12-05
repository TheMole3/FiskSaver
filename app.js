const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require("fs")
const path = require('path');

function checkExistsWithTimeout(filePath, timeout) {
    return new Promise(function (resolve, reject) {

        var timer = setTimeout(function () {
            watcher.close();
            reject(new Error('File did not exists and was not created during the timeout.'));
        }, timeout);

        var dir = path.dirname(filePath);
        var basename = path.basename(filePath);
        var watcher = fs.watch(dir, function (eventType, filename) {
            if (eventType === 'rename' && filename === basename) {
                clearTimeout(timer);
                resolve();
            }
        });
    });
}

const secret = require("./secret.json");

let options = new chrome.Options();
//Below arguments are critical for Heroku deployment
options.addArguments("--headless");
options.addArguments("--disable-gpu");
options.addArguments("--no-sandbox");
options.setUserPreferences(
  { "download.default_directory": __dirname + "\\image" }
);

(async function example() {
  let driver = await new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options).build();
  try {
    await driver.get('https://whiteboard.microsoft.com/me/whiteboards/ed8015d6-206b-4418-8cd5-0ade9f528db6');
    await driver.findElement(By.id('i0116')).sendKeys(secret.email, Key.RETURN);
    await driver.sleep(1000)
    await driver.findElement(By.id('i0118')).sendKeys(secret.password, Key.RETURN);
    await driver.sleep(5000)
    await driver.wait(until.elementLocated(By.id('settingsButton')), 60 * 1000)
    await driver.findElement(By.id('settingsButton')).click();
    await driver.findElement(By.id('exportButton')).click();
    await checkExistsWithTimeout(__dirname + "/image/Whiteboard.png", 60 * 1000)
    await driver.sleep(5000)
    var date = new Date();
    fs.copyFile(__dirname + "\\image\\Whiteboard.png", __dirname + "\\images\\" + date.valueOf() + ".png", (err) => {
      if(err) console.log(err)
      fs.unlink(__dirname + "\\image\\Whiteboard.png", (err) => {
        if(err) console.log(err)
        return process.exit()
      });
    })
  }
  finally {
    await driver.quit();
  }
})();
