const puppeteer = require('puppeteer');
const { URL } = require('url');

async function ScrapeLinks(links = []) {


    function splitList(originialList = []) {
        const originalArray = originialList;
        const numArrays = Math.ceil(originalArray.length / 5);

        // Create an array to store the smaller arrays
        const smallerArrays = [];

        // Use a loop to create and push the smaller arrays
        for (let i = 0; i < numArrays; i++) {
            const startIdx = i * 5;
            const endIdx = startIdx + 5;
            const smallerArray = originalArray.slice(startIdx, endIdx);
            smallerArrays.push(smallerArray);
        }

        return smallerArrays
    }

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
        //let substringsToCheck = ["wp-content", "blog", "content-wrap", ".jpg", ".png", ".pdf", ".jpeg", ".mp3", ".mp4", "sidewidgetarea", "policy", "terms", "/#"];
        let substringsToCheck = ["/home", "/contact", "/about", "/we", "/our", "/serv", "home", "contact", "about", "services"]
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
                        if (checkPage) { linksToVisit.push(absoluteUrl); }
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

    async function bitScrape(arrlinks = []) {
        let bitScrapeResults = {}
        await Promise.all(arrlinks.map(async (link) => {

            let emailsFound = await crawlDomain(link);
            let emailArray = Array.from(emailsFound);
            let arrayWhithNoDuplicates = removeDuplicates(emailArray)
            let resultString = arrayWhithNoDuplicates.join(',');

            bitScrapeResults[link] = resultString;
        }));

        return bitScrapeResults;
    }

    if (links.length > 5) {
        let newList = splitList(links)
        // console.log(newList)

        let bitScrapeResults = {};

        for (let i = 0; i < newList.length; i++) {
            let scrapeResult = await bitScrape(newList[i])
            bitScrapeResults = { ...bitScrapeResults, ...scrapeResult }
        }

        return bitScrapeResults




    }
    else {
        let scrapeResult = await bitScrape(links)
        return scrapeResult
    }



}



module.exports = ScrapeLinks