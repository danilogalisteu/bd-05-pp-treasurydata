
async function fetchResponse(url, contentType='text/html', options={}, verbose=false) {
    try {
        if (verbose) {
            console.log(`fetching ${url}...`)
        }
        const response = await fetch(url, options)
        const status = response.status
        if (status >= 400) {
            if (verbose) {
                console.log(`fetch response error on ${url}: ${status}`)
            }
            return
        }
        const ctype = response.headers.get('content-type')
        if (!ctype.includes(contentType)) {
            if (verbose) {
                console.log(`fetch content error on ${url}: ${ctype}`)
            }
            return
        }
        return response
    }
    catch (err) {
        if (verbose) {
            console.log(`fetch error on ${url}: ${err}`)
        }
    }
}



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
    const treasuryTableJSONURL = 'https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json'
    const response = await fetchResponse(treasuryTableJSONURL, 'application/json', {}, verbose)
    if (response) {
        const content = await response.json()
        const marketDataObj = content['response']['TrsrBondMkt']
        console.log(`Content:\n${JSON.stringify(marketDataObj, null, 4)}`)
        const bondDataArray = parseTreasuryTable(content)
        console.log(`Content:\n${JSON.stringify(bondDataArray, null, 4)}`)
    }
}


function parseTreasuryPriceHistory(content) {
    const priceHistoryObj = content['response']['TrsrBd']
    const priceHistoryArray = [
        ['code', 'timeOpen', 'timeClose', 'bid', 'ask', 'bidRate', 'askRate'],
    ]
    priceHistoryObj.forEach(
        (element, index, array) => {
            priceHistoryArray.push([
                element['cd'],
                element['PrcgLst']['TrsrBdMkt']['opngDtTm'],
                element['PrcgLst']['TrsrBdMkt']['clsgDtTm'],
                element['PrcgLst']['untrRedVal'],
                element['PrcgLst']['untrInvstmtVal'],
                element['PrcgLst']['anulRedRate'],
                element['PrcgLst']['anulInvstmtRate'],
            ])
        }
    )
    return priceHistoryArray
}


async function getTreasuryPriceHistory(code, period=30, verbose=false) {
    const treasuryPriceHistoryJSONURL = `https://www.tesourodireto.com.br/b3/tesourodireto/pricesAndFeesHistory?codigo=${code}&periodo=${period}`
    const response = await fetchResponse(treasuryPriceHistoryJSONURL, 'application/json', {}, verbose)
    if (response) {
        const content = await response.json()
        const priceHistoryArray = parseTreasuryPriceHistory(content)
        console.log(`Content:\n${JSON.stringify(priceHistoryArray, null, 4)}`)
    }
}


module.exports = {
    getTreasuryTable,
    getTreasuryPriceHistory
}
