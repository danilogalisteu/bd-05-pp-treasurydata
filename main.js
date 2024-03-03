
const { getTreasuryTable, getTreasuryPriceHistory } = require('./treasury.js')


async function main() {
    console.log(`treasurydata is starting`)
    await getTreasuryTable(true)
    await getTreasuryPriceHistory(204, 30, true)
}


main()
