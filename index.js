const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const fs = require('fs');

const delay = (time) =>  {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

async function sendWhatsAppMessage() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args:['--start-fullscreen']
    });
    const page = await browser.newPage();
    const recorder = new PuppeteerScreenRecorder(page);
    const date = new Date().toLocaleString();
    await recorder.start(`./test_latest.mp4`);
    await page.goto('https://web.whatsapp.com/');
    console.log('Please scan the QR code with your phone.');

    // Wait for QR code scan
    await page.waitForSelector('#side', {timeout: 90000});

    // Load the Excel file
    console.log('Loading Excel file...');
    const workbook = xlsx.readFile('./test.xlsx');
    const iamgepath = './Clinic_Offer.jpeg'; 
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log('Loaded Excel file.');
    
    // Handle the dialog
    page.on('dialog', async (dialog) => {
        console.log('Handling dialog...');
        await dialog.accept();
    });
    for (const row of data) {
        const name = row['name'];
        const phoneNumber = row['phone number'];
        const specificMessageForUser = row['message'];
            // Handle the image file
            console.log('Sending image and message to ' + name + ' on ' + phoneNumber + '...');
            // Navigate to the chat
            await page.goto(`https://web.whatsapp.com/send?phone=${phoneNumber}`, {waitUntil: 'domcontentloaded'});;
            console.log('domcontentloaded');
            await page.waitForSelector('[title="Attach"]', { timeout: 180000, visible: true, });
            console.log('attach button visible');

            // Click on the attachment button using page.evaluate
            await page.evaluate(() => {
                const attachButton = document.querySelector('[title="Attach"]');
                console.log('gotten the attach button');
                if (attachButton) {
                    attachButton.click();
                }
            });

            // Wait for the file input to be available
            const fileInputSelector =  'input[accept="image/*,video/mp4,video/3gpp,video/quicktime"][type="file"]';
            await page.waitForSelector(fileInputSelector, {timeout: 120000});

            // Upload the file
            const input = await page.$(fileInputSelector);
            await input.uploadFile(iamgepath);
            await delay(2000);

            // Enter the text message
            await page.type('[title="Type a message"]', specificMessageForUser);
            await delay(10000);

            // Send the message
            await page.keyboard.press('Enter');
            await delay(2000);
            console.log('Message and image sent to ' + name + ' on ' + phoneNumber + '.');
    }
    await recorder.stop();
    await browser.close();
}

sendWhatsAppMessage().catch(console.error);
