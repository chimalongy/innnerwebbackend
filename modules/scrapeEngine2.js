const puppeteer = require('puppeteer');
const { URL } = require('url');

async function ScrapeLinks(links = []) {



    function removeDuplicates(array) {
        let uniqueArray = [];

        for (let i = 0; i < array.length; i++) {
            // Convert each item to lowercase before checking for duplicates
            let currentItem = array[i].toLowerCase();

            if (uniqueArray.indexOf(currentItem) === -1) {
                uniqueArray.push(currentItem);
            }
        }
        return uniqueArray;
    }
    async function crawlDomain(domain) {
        let substringsToCheck = ["wp-content", "blog", "content-wrap", ".jpg", ".png", ".pdf", ".jpeg", ".mp3", ".mp4", "sidewidgetarea"];
        const browser = await puppeteer.launch();
        // const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const visitedPages = new Set();
        const linksToVisit = [domain];
        const results = new Set();

        try {
            while (linksToVisit.length > 0) {
                const currentUrl = linksToVisit.pop();

                if (visitedPages.has(currentUrl)) {
                    continue;
                }

                console.log('Visiting:', currentUrl);
                visitedPages.add(currentUrl);

                const page = await browser.newPage();
                // just added

                await page.setRequestInterception(true);

                page.on('request', (req) => {
                    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });


                await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });

                // Extracting and checking links
                const newLinks = await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('a[href]'));
                    return links.map(link => link.href);
                });

                for (const newLink of newLinks) {
                    const absoluteUrl = new URL(newLink, currentUrl).href;

                    // Check if the new link is within the specified domain
                    if (new URL(absoluteUrl).hostname === new URL(domain).hostname) {
                        let checkPage = substringsToCheck.some(substring => absoluteUrl.includes(substring))
                        if (!checkPage) {
                            linksToVisit.push(absoluteUrl);
                        }
                    }
                }

                // Extracting and checking emails
                const pageContent = await page.content();
                const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
                const emails = pageContent.match(emailRegex);

                if (emails) {
                    emails.forEach(email => {
                        results.add(email);
                    });
                }

                await page.close();
            }
            await browser.close();
            return results
        }
        catch (error) {
            return ""
        }
        // console.log('Emails found:', Array.from(results));
    }

    let scrapeResult = {}
    // for (let i = 0; i < links.length; i++) {
    //     let emailsFound = await crawlDomain(links[i]);
    //     let emailArray = Array.from(emailsFound)
    //     let resultString = ""

    //     if (emailArray.length > 1) {
    //         for (let j = 0; j < emailArray.length; j++) {
    //             if (j != emailArray.length - 1) { resultString += emailArray[i] + "," }
    //             else { resultString += emailArray[i] }
    //         }
    //     }
    //     else { resultString = emailArray[0] }
    //     scrapeResult[links[i]] = resultString

    // }
    await Promise.all(links.map(async (link) => {
        let emailsFound = await crawlDomain(link);
        let emailArray = Array.from(emailsFound);
        let arrayWhithNoDuplicates = removeDuplicates(emailArray)
        let resultString = arrayWhithNoDuplicates.join(',');

        scrapeResult[link] = resultString; 
    }));
    // console.log(scrapeResult)

    return scrapeResult

}

// ScrapeLinks(['http://austinstarpoolservice.com/', 'http://www.onethousandwaves.com/'])

module.exports = ScrapeLinks





