
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const { getTreasuryTable, getTreasuryPriceHistory } = require('./treasury.js')


async function updateTreasuryData(boxMarket, tableBonds) {
    const [marketDataObj, bondDataArray] = await getTreasuryTable(true)

    colorMarket = marketDataObj['status'] == 'Aberto' ? 'green' : 'orange'
    stringMarket =
        `Status  {${colorMarket}-fg}${marketDataObj['status']} [${marketDataObj['statusCode']}]{/${colorMarket}-fg}` + '\n' +
        `Current {${colorMarket}-fg}${marketDataObj['quoteTime']}{/${colorMarket}-fg}` + '\n' +
        `Open    ${marketDataObj['openTime']}` + '\n' +
        `Close   ${marketDataObj['closeTime']}`
    boxMarket.setContent(stringMarket)

    tableBonds.setData({
        headers: bondDataArray.slice(0, 1)[0].slice(0, -3),
        data: bondDataArray.slice(1, -1).map((el) => el.slice(0, -3)),
    })
}


async function showMainWindow() {
    const screen = blessed.screen()
    screen.program.clear()
    const grid = new contrib.grid({rows: 100, cols: 100, screen: screen})

    const paramsBoxMarket = {
        label: 'Treasury Market',
        tags: true,
        border: {type: 'line', fg: "cyan"},
        fg: 'white',
      }
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
        columnWidth: [10, 10, 45, 12, 6, 10, 10, 10, 10, 15, 5],
    }

    const boxMarket = grid.set(85, 80, 17, 20, blessed.box, paramsBoxMarket)
    const tableBonds = grid.set(0, 0, 100, 80, contrib.table, paramsTableBonds)

    screen.append(boxMarket)
    screen.append(tableBonds)
    tableBonds.focus()

    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        return process.exit(0);
    });

    await updateTreasuryData(boxMarket, tableBonds)

    screen.render()
}


module.exports = {
    showMainWindow,
}
