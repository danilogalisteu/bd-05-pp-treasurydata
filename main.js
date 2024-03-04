
const { getTreasuryTable, getTreasuryPriceHistory } = require('./treasury.js')


async function main() {
    console.log(`treasurydata is starting`)

    const [marketDataObj, bondDataArray] = await getTreasuryTable(true)
    console.log(JSON.stringify(marketDataObj, null, 4))
    console.log(JSON.stringify(bondDataArray, null, 4))

    const priceHistoryArray = await getTreasuryPriceHistory(204, 30, true)
    console.log(JSON.stringify(priceHistoryArray, null, 4))
}


main()
