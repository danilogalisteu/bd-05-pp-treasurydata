
const puppeteer = require("puppeteer")
const dfd = require("danfojs-node")


function parseMarketData(content) {
    const marketDataObj = {
        quoteTime: content['response']['TrsrBondMkt']['qtnDtTm'].replace('T', ' '),
        openTime: content['response']['TrsrBondMkt']['opngDtTm'].replace('T', ' '),
        closeTime: content['response']['TrsrBondMkt']['clsgDtTm'].replace('T', ' '),
        statusCode: content['response']['TrsrBondMkt']['stsCd'],
        status: content['response']['TrsrBondMkt']['sts'],
    }
    return marketDataObj
}


function parseTreasuryTable(content) {
    const bondDataObj = content['response']['TrsrBdTradgList']
    const bondDataColumns = [
        'Index', 'Type', 'Maturity', 'Name', 'Coupon',
        'Bid Price', 'Ask Price', 'Bid Rate', 'Ask Rate',
        'ISIN', 'Code', 'Info', 'Objective', 'Income'
    ]
    const bondDataArray = []
    bondDataObj.forEach(
        (element, index, array) => {
            bondDataArray.push([
                element['TrsrBd']['FinIndxs']['nm'],
                element['TrsrBdType']['nm'],
                element['TrsrBd']['mtrtyDt'].slice(0, 10),
                element['TrsrBd']['nm'],
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
    const df = new dfd.DataFrame(bondDataArray, {columns: bondDataColumns})
        .sortValues('Maturity').sortValues('Type').sortValues('Index')
    return df
}


async function getTreasuryTable() {
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
    return [parseMarketData(dataObj), parseTreasuryTable(dataObj)]
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


async function getTreasuryPriceHistory(code, period=30) {
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
