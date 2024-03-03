
async function getTreasuryTable(verbose=false) {
    const treasuryTableJSONURL = 'https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json'
    try {
        if (verbose) {
            console.log(`fetching ${treasuryTableJSONURL}...`)
        }
        const response = await fetch(treasuryTableJSONURL)
        const status = response.status
        if (status >= 400) {
            if (verbose) {
                console.log(`fetch response error on ${treasuryTableJSONURL}: ${status}`)
            }
            return pages
        }
        const ctype = response.headers.get('content-type')
        if (!ctype.includes('application/json')) {
            if (verbose) {
                console.log(`fetch content error on ${treasuryTableJSONURL}: ${ctype}`)
            }
            return pages
        }
        const content = await response.json()
        console.log(`Content:\n${JSON.stringify(content, null, 4)}`)
    }
    catch (err) {
        if (verbose) {
            console.log(`fetch error on ${treasuryTableJSONURL}: ${err}`)
        }
    }
}


async function getTreasuryPriceHistory(code, period=30, verbose=false) {
    const treasuryPriceHistoryJSONURL = `https://www.tesourodireto.com.br/b3/tesourodireto/pricesAndFeesHistory?codigo=${code}&periodo=${period}`
    try {
        if (verbose) {
            console.log(`fetching ${treasuryPriceHistoryJSONURL}...`)
        }
        const response = await fetch(treasuryPriceHistoryJSONURL)
        const status = response.status
        if (status >= 400) {
            if (verbose) {
                console.log(`fetch response error on ${treasuryPriceHistoryJSONURL}: ${status}`)
            }
            return pages
        }
        const ctype = response.headers.get('content-type')
        if (!ctype.includes('application/json')) {
            if (verbose) {
                console.log(`fetch content error on ${treasuryPriceHistoryJSONURL}: ${ctype}`)
            }
            return pages
        }
        const content = await response.json()
        console.log(`Content:\n${JSON.stringify(content, null, 4)}`)
    }
    catch (err) {
        if (verbose) {
            console.log(`fetch error on ${treasuryPriceHistoryJSONURL}: ${err}`)
        }
    }
}


module.exports = {
    getTreasuryTable,
    getTreasuryPriceHistory
}
