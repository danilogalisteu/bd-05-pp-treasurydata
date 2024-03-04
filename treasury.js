
const puppeteer = require("puppeteer")


function parseTreasuryTable(content) {
    const bondDataObj = content['response']['TrsrBdTradgList']
    const bondDataArray = [
        ['Index', 'Type', 'Name', 'Maturity', 'Coupon', 'Bid Price', 'Ask Price', 'Bid Rate', 'Ask Rate', 'ISIN', 'Code', 'Info', 'Bbjective', 'Income'],
    ]
    bondDataObj.forEach(
        (element, index, array) => {
            bondDataArray.push([
                element['TrsrBd']['FinIndxs']['nm'],
                element['TrsrBdType']['nm'],
                element['TrsrBd']['nm'],
                element['TrsrBd']['mtrtyDt'].slice(0, 10),
                element['TrsrBd']['semiAnulIntrstInd'] ? 'Y' : 'N',
                element['TrsrBd']['untrRedVal'],
                element['TrsrBd']['untrInvstmtVal'],
                element['TrsrBd']['anulRedRate'],
                element['TrsrBd']['anulInvstmtRate'],
                element['TrsrBd']['isinCd'],
                element['TrsrBd']['cd'],
                element['TrsrBd']['featrs']      ? element['TrsrBd']['featrs'].trim()      : "",
                element['TrsrBd']['invstmtStbl'] ? element['TrsrBd']['invstmtStbl'].trim() : "",
                element['TrsrBd']['rcvgIncm']    ? element['TrsrBd']['rcvgIncm'].trim()    : "",
            ])
        }
    )
    return bondDataArray
}


async function getTreasuryTable(verbose=false) {
    const treasuryHomeURL = 'https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm'
    const treasuryDataURL = `https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json`

    const browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage()
    page.setViewport({width: 1600, height: 900})

    const [dataResponse] = await Promise.all([
        page.waitForResponse((response) => response.url().startsWith(treasuryDataURL), {timeout: 90_000}),
        page.goto(treasuryHomeURL, {waitUntil: "load"}),
    ]);

    const content = await dataResponse.text()
    await browser.close()

    const dataObj = JSON.parse(content)
    const marketDataObj = {
        quoteTime: dataObj['response']['TrsrBondMkt']['qtnDtTm'].replace('T', ' '),
        openTime: dataObj['response']['TrsrBondMkt']['opngDtTm'].replace('T', ' '),
        closeTime: dataObj['response']['TrsrBondMkt']['clsgDtTm'].replace('T', ' '),
        statusCode: dataObj['response']['TrsrBondMkt']['stsCd'],
        status: dataObj['response']['TrsrBondMkt']['sts'],
    }
    return [marketDataObj, parseTreasuryTable(dataObj)]
}


function parseTreasuryPriceHistory(content) {
    const priceHistoryObj = content['response']['TrsrBd']['PrcgLst']
    const priceHistoryArray = [
        ['timeOpen', 'timeClose', 'bid', 'ask', 'bidRate', 'askRate'],
    ]
    priceHistoryObj.forEach(
        (element, index, array) => {
            priceHistoryArray.push([
                element['TrsrBdMkt']['opngDtTm'],
                element['TrsrBdMkt']['clsgDtTm'],
                element['untrRedVal'],
                element['untrInvstmtVal'],
                element['anulRedRate'],
                element['anulInvstmtRate'],
            ])
        }
    )
    return priceHistoryArray
}


async function getTreasuryPriceHistory(code, period=30, verbose=false) {
    const treasuryHistURL = 'https://www.tesourodireto.com.br/titulos/historico-de-precos-e-taxas.htm'
    const treasuryDataURL = `https://www.tesourodireto.com.br/b3/tesourodireto/pricesAndFeesHistory`

    const browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage()
    page.setViewport({width: 1600, height: 900})

    await page.goto(treasuryHistURL, {waitUntil: 'load'})
    await page.click('div.td-form-select-input > div')

    const attr = await page.$$eval("#ul-list > li", el => el.map(x => x.getAttribute("data-codigo")));
    const items = await page.$$('#ul-list > li')
    const itemPos = attr.indexOf(code.toString())
    const itemElement = items[itemPos]

    const [dataResponse] = await Promise.all([
        page.waitForResponse((response) => response.url().startsWith(treasuryDataURL), {timeout: 90_000}),
        itemElement.click(),
    ]);

    const content = await dataResponse.text()
    await browser.close()

    const dataObj = JSON.parse(content)
    return parseTreasuryPriceHistory(dataObj)
}


module.exports = {
    getTreasuryTable,
    getTreasuryPriceHistory
}
