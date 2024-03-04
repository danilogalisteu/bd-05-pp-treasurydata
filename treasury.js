
const puppeteer = require("puppeteer")


function parseTreasuryTable(content) {
    const bondDataObj = content['response']['TrsrBdTradgList']
    const bondDataArray = [
        ['code', 'name', 'maturity', 'coupon', 'bid', 'ask', 'bidRate', 'askRate', 'isin', 'index', 'typeName'],
    ]
    bondDataObj.forEach(
        (element, index, array) => {
            bondDataArray.push([
                element['TrsrBd']['cd'],
                element['TrsrBd']['nm'],
                element['TrsrBd']['mtrtyDt'],
                element['TrsrBd']['semiAnulIntrstInd'],
                element['TrsrBd']['untrRedVal'],
                element['TrsrBd']['untrInvstmtVal'],
                element['TrsrBd']['anulRedRate'],
                element['TrsrBd']['anulInvstmtRate'],
                element['TrsrBd']['isinCd'],
                element['TrsrBd']['FinIndxs']['nm'],
                element['TrsrBdType']['nm'],
                element['TrsrBd']['featrs'],
                element['TrsrBd']['invstmtStbl'],
                element['TrsrBd']['rcvgIncm'],
            ])
        }
    )
    return bondDataArray
}


async function getTreasuryTable(verbose=false) {
    const browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage()
    page.setViewport({width: 1600, height: 900})

    const treasuryHomeURL = 'https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm'
    const treasuryDataURL = `https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json`

    const [dataResponse] = await Promise.all([
        page.waitForResponse((response) => response.url().startsWith(treasuryDataURL), {timeout: 90_000}),
        page.goto(treasuryHomeURL, {waitUntil: "domcontentloaded"}),
    ]);

    const content = await dataResponse.text()
    await browser.close()

    const dataObj = JSON.parse(content)
    const marketDataObj = dataObj['response']['TrsrBondMkt']
    console.log(JSON.stringify(marketDataObj, null, 4))
    const bondDataArray = parseTreasuryTable(dataObj)
    console.log(JSON.stringify(bondDataArray, null, 4))
}


function parseTreasuryPriceHistory(content) {
    const priceHistoryObj = content['response']['TrsrBd']['PrcgLst']
    const priceHistoryArray = [
        ['code', 'timeOpen', 'timeClose', 'bid', 'ask', 'bidRate', 'askRate'],
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
    const browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage()
    page.setViewport({width: 1600, height: 900})

    const treasuryHistURL = 'https://www.tesourodireto.com.br/titulos/historico-de-precos-e-taxas.htm'
    const treasuryDataURL = `https://www.tesourodireto.com.br/b3/tesourodireto/pricesAndFeesHistory`

    await page.goto(treasuryHistURL, {waitUntil: 'load'})
    await page.click('div.td-form-select-input > div')

    const attr = await page.$$eval("#ul-list > li", el => el.map(x => x.getAttribute("data-codigo")));
    const items = await page.$$('#ul-list > li')
    const itemPos = attr.indexOf(code.toString())
    const itemElement = items[itemPos]
    itemElement.click()

    const dataResponse = await page.waitForResponse(
        (response) => response.url().startsWith(treasuryDataURL)
    )

    const content = await dataResponse.text()
    await browser.close()

    const dataObj = JSON.parse(content)
    const priceHistoryArray = parseTreasuryPriceHistory(dataObj)
    console.log(JSON.stringify(priceHistoryArray, null, 4))
}


module.exports = {
    getTreasuryTable,
    getTreasuryPriceHistory
}
