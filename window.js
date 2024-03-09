
const blessed = require('blessed')
const contrib = require('blessed-contrib')
const { getTreasuryTable, getTreasuryPriceHistory } = require('./treasury.js')


let screen = {}
let marketDataObj = {}
let bondDataDF = {}
let tableBonds = {}
let boxBonds = {}
let boxMarket = {}
let linePrices = {}
let lineYields = {}


async function updateTreasuryData() {
    [marketDataObj, bondDataDF] = await getTreasuryTable(true)

    colorMarket = marketDataObj['status'] == 'Aberto' ? 'green' : 'red'
    stringMarket =
        `{bold}Status{/bold} {${colorMarket}-fg}${marketDataObj['status']} [${marketDataObj['statusCode']}]{/${colorMarket}-fg}` + '\n' +
        `{bold}Last{/bold}   ${marketDataObj['quoteTime']}` + '\n' +
        `{bold}Open{/bold}   ${marketDataObj['openTime']}` + '\n' +
        `{bold}Close{/bold}  ${marketDataObj['closeTime']}`
    boxMarket.setContent(stringMarket)

    const tableDataDF = bondDataDF.loc({columns: [
        'Index', 'Type', 'Maturity', 'Coupon', 'Name'
    ]})
    tableBonds.setData({
        headers: tableDataDF.columns,
        data: tableDataDF.values,
    })

    await updateTreasuryInfo(0)
}


async function updateTreasuryInfo(indexTable) {
    const infoBond = bondDataDF.iloc({rows: [indexTable]})
    const stringBond =
        `{bold}Bond{/bold}       ${infoBond['Type'].values[0]} ${infoBond['Maturity'].values[0]}` + '\n' +
        `{bold}Coupon{/bold}     ${infoBond['Coupon'].values[0]}` + '\n' +
        `{bold}Code{/bold}       ${infoBond['Code'].values[0]}` + '\n' +
        `{bold}ISIN{/bold}       ${infoBond['ISIN'].values[0]}` + '\n\n' +
        `{bold}Bid Price{/bold}  ${infoBond['Bid Price'].values[0]}` + '\n' +
        `{bold}Ask Price{/bold}  ${infoBond['Ask Price'].values[0]}` + '\n' +
        `{bold}Bid Rate{/bold}   ${infoBond['Bid Rate'].values[0]}` + '\n' +
        `{bold}Ask Rate{/bold}   ${infoBond['Ask Rate'].values[0]}` + '\n\n' +
        `{bold}Info{/bold}       ${infoBond['Info'].values[0]}` + '\n\n' +
        `{bold}Objective{/bold}  ${infoBond['Objective'].values[0]}` + '\n\n' +
        `{bold}Income{/bold}     ${infoBond['Income'].values[0]}`
    boxBonds.setContent(stringBond)
    screen.render()
}


async function showMainWindow() {
    screen = blessed.screen()
    screen.program.clear()
    const grid = new contrib.grid({rows: 100, cols: 100, screen: screen})

    const paramsTableBonds = {
        keys: true,
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

    screen.key([`escape`, 'C-c'], function(ch, key) {
        return process.exit(0);
    });

    screen.render()

    let msg = blessed.message({
        parent: screen,
        top: 'center',
        left: 'center',
        height: 'shrink',
        width: '40%',
        align: 'center',
        label: ' Main view ',
        tags: true,
        hidden: true,
        border:  {type: 'bg', fg: 'green', ch: '▓'},
    });

    msg.display("\n  Keyboard shortcuts:\n\n\t∙ [↑] and [↓] keys to move up and down the table\n\t∙ [Enter] to see extra detail on the selected bond\n\t∙ [R] to update treasury data\n\t∙ [Escape] or [Ctrl]+[C] to exit the application\n\t∙ any key to dismiss this message\n", -1)

    await updateTreasuryData()

    tableBonds.rows.on('keypress', async function(ch, key) {
        if ((key.name == 'down') || (key.name == 'up')) {
            const indexTable = tableBonds.rows.selected
            await updateTreasuryInfo(indexTable)
        }
        if (key.name == 'enter') {
            const indexTable = tableBonds.rows.selected
            screen.destroy()
            await showDetailWindow(indexTable)
        }
        if (ch == 'r') {
            await updateTreasuryData()
        }
    });

    tableBonds.focus()
}


async function showDetailWindow(indexTable) {
    screen = blessed.screen()
    screen.program.clear()
    const grid = new contrib.grid({rows: 100, cols: 100, screen: screen})

    const paramsLinePrices = {
        style: {line: "yellow", text: "green", baseline: "black"},
        xLabelPadding: 3,
        xPadding: 5,
        showLegend: true,
        wholeNumbersOnly: false, //true=do not show fraction in y axis
        label: 'Price History',
    }
    const paramsLineYields = {
        style: {line: "yellow", text: "green", baseline: "black"},
        xLabelPadding: 3,
        xPadding: 5,
        showLegend: true,
        wholeNumbersOnly: false, //true=do not show fraction in y axis
        label: 'Yield History',
    }

    linePrices = grid.set(0, 0, 50, 100, contrib.line, paramsLinePrices)
    lineYields = grid.set(50, 0, 50, 100, contrib.line, paramsLineYields)

    screen.key(['escape'], async function(ch, key) {
        await showMainWindow();
    });

    screen.key(['C-c'], function(ch, key) {
        return process.exit(0);
    });

    screen.render()

    let msg = blessed.message({
        parent: screen,
        top: 'center',
        left: 'center',
        height: 'shrink',
        width: '40%',
        align: 'center',
        label: ' Detail view ',
        tags: true,
        hidden: true,
        border:  {type: 'bg', fg: 'green', ch: '▓'},
    });

    msg.display("\n  Keyboard shortcuts:\n\n\t∙ [R] to update treasury data\n\t∙ [Escape] to return to the main view\n\t∙ [Ctrl]+[C] to exit the application\n\t∙ any key to dismiss this message\n", -1)
}


module.exports = {
    showMainWindow,
}
