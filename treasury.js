
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


async function getTreasuryTable(verbose=false) {
    const treasuryTableJSONURL = 'https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json'
    const response = await fetchResponse(treasuryTableJSONURL, 'application/json', {}, verbose)
    if (response) {
        const content = await response.json()
        console.log(`Content:\n${JSON.stringify(content, null, 4)}`)
    }
}


async function getTreasuryPriceHistory(code, period=30, verbose=false) {
    const treasuryPriceHistoryJSONURL = `https://www.tesourodireto.com.br/b3/tesourodireto/pricesAndFeesHistory?codigo=${code}&periodo=${period}`
    const response = await fetchResponse(treasuryPriceHistoryJSONURL, 'application/json', {}, verbose)
    if (response) {
        const content = await response.json()
        console.log(`Content:\n${JSON.stringify(content, null, 4)}`)
    }
}


module.exports = {
    getTreasuryTable,
    getTreasuryPriceHistory
}
