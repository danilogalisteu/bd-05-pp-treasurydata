
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const { getTreasuryTable, getTreasuryPriceHistory } = require('./treasury.js')


let screen = {}
let marketDataObj = {}
let bondDataDF = {}
let tableBonds = {}
let boxBonds = {}
let boxMarket = {}

async function updateTreasuryData() {
    [marketDataObj, bondDataDF] = await getTreasuryTable(true)

    colorMarket = marketDataObj['status'] == 'Aberto' ? 'green' : 'red'
    stringMarket =
        `Status {${colorMarket}-fg}${marketDataObj['status']} [${marketDataObj['statusCode']}]{/${colorMarket}-fg}` + '\n' +
        `Last   ${marketDataObj['quoteTime']}` + '\n' +
        `Open   ${marketDataObj['openTime']}` + '\n' +
        `Close  ${marketDataObj['closeTime']}`
    boxMarket.setContent(stringMarket)

    const tableDataDF = bondDataDF.loc({columns: [
        'Index', 'Type', 'Maturity', 'Coupon', 'Name'
    ]})
    tableBonds.setData({
        headers: tableDataDF.columns,
        data: tableDataDF.values,
    })
}

async function updateTreasuryInfo() {
    const indexTable = tableBonds.rows.selected
    const infoBond = bondDataDF.iloc({rows: [indexTable]})
    const stringBond =
        `Index      ${indexTable}` + '\n' +
        `Sel        ${tableBonds.rows.selected}` + '\n' +
        `Total      ${tableBonds.rows.items.length}` + '\n\n' +
        `Bond       ${infoBond['Type'].values[0]} ${infoBond['Maturity'].values[0]}` + '\n' +
        `Code       ${infoBond['Code'].values[0]}` + '\n' +
        `ISIN       ${infoBond['ISIN'].values[0]}` + '\n\n' +
        `Bid Price  ${infoBond['Bid Price'].values[0]}` + '\n' +
        `Ask Price  ${infoBond['Ask Price'].values[0]}` + '\n' +
        `Bid Rate   ${infoBond['Bid Rate'].values[0]}` + '\n' +
        `Ask Rate   ${infoBond['Ask Rate'].values[0]}` + '\n\n' +
        `Info       ${infoBond['Info'].values[0]}` + '\n\n' +
        `Objective  ${infoBond['Objective'].values[0]}` + '\n\n' +
        `Income     ${infoBond['Income'].values[0]}`
    boxBonds.setContent(stringBond)
    screen.render()
}


async function showMainWindow() {
    screen = blessed.screen()
    screen.program.clear()
    const grid = new contrib.grid({rows: 100, cols: 100, screen: screen})

    const paramsTableBonds = {
        keys: true,
        vi: true,
        fg: 'white',
        selectedFg: 'white',
        selectedBg: 'blue',
        interactive: true,
        label: 'Treasury Bonds',
        border: {type: "line", fg: "cyan"},
        columnSpacing: 3,
        columnWidth: [10, 10, 12, 6, 45],
    }
    const paramsBoxBonds = {
        label: 'Bond Info',
        tags: true,
        border: {type: 'line', fg: "cyan"},
        fg: 'white',
    }
    const paramsBoxMarket = {
        label: 'Treasury Market',
        tags: true,
        border: {type: 'line', fg: "cyan"},
        fg: 'white',
    }

    tableBonds = grid.set(0, 0, 100, 70, contrib.table, paramsTableBonds)
    boxBonds = grid.set(0, 70, 85, 30, blessed.box, paramsBoxBonds)
    boxMarket = grid.set(85, 70, 17, 30, blessed.box, paramsBoxMarket)

    screen.append(tableBonds)
    screen.append(boxBonds)
    screen.append(boxMarket)
    tableBonds.focus()

    tableBonds.rows.on('keypress', async function(ch, key) {
        if ((key.name == 'down') || (key.name == 'up')) {
            await updateTreasuryInfo()
        }
    });

    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        return process.exit(0);
    });

    await updateTreasuryData()
    await updateTreasuryInfo(0)

    screen.render()
}


module.exports = {
    showMainWindow,
}
