
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
    [marketDataObj, bondDataDF] = await getTreasuryTable()

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

    screen.key(['escape', 'C-c'], function(ch, key) {
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


async function updateHistoryData(indexTable) {
    const code = bondDataDF.iloc({rows: [indexTable]}).loc({columns: ['Code']}).values[0][0]
    const historyDataDF = await getTreasuryPriceHistory(code)

    const minBidPrice = historyDataDF['bid'].min()
    const maxBidPrice = historyDataDF['bid'].max()
    const minPrice = historyDataDF.loc({columns: ['bid', 'ask']}).min().min()
    const maxPrice = historyDataDF.loc({columns: ['bid', 'ask']}).max().max()
    const priceMinY = minPrice ? minPrice : minBidPrice
    const priceMaxY = maxPrice ? maxPrice : maxBidPrice
    const priceRangeY = priceMaxY - priceMinY
    linePrices.options.minY = priceMinY - priceRangeY * 0.2
    linePrices.options.maxY = priceMaxY + priceRangeY * 0.2

    const dataBidPrice = historyDataDF.loc({columns: ['timeOpen', 'bid']}).dropNa(axis=1)
    const dataAskPrice = historyDataDF.loc({columns: ['timeOpen', 'ask']}).dropNa(axis=1)

    const seriesBidPrice = {
        title: 'Bid Price',
        x: dataBidPrice['timeOpen'].values,
        y: dataBidPrice['bid'].values,
        style: {line: 'green'},
    }
    const seriesAskPrice = {
        title: 'Ask Price',
        x: dataAskPrice['timeOpen'].values,
        y: dataAskPrice['ask'].values,
        style: {line: 'red'},
    }
    linePrices.setData([seriesBidPrice, seriesAskPrice])

    const minBidYield = historyDataDF['bidRate'].min()
    const maxBidYield = historyDataDF['bidRate'].max()
    const minYield = historyDataDF.loc({columns: ['bidRate', 'askRate']}).min().min()
    const maxYield = historyDataDF.loc({columns: ['bidRate', 'askRate']}).max().max()
    const yieldMinY = minYield ? minYield : minBidYield
    const yieldMaxY = maxYield ? maxYield : maxBidYield
    const yieldRangeY = yieldMaxY - yieldMinY
    lineYields.options.minY = yieldMinY - yieldRangeY * 0.2
    lineYields.options.maxY = yieldMaxY + yieldRangeY * 0.2

    const dataBidYield = historyDataDF.loc({columns: ['timeOpen', 'bidRate']}).dropNa(axis=1)
    const dataAskYield = historyDataDF.loc({columns: ['timeOpen', 'askRate']}).dropNa(axis=1)
    const seriesBidYield = {
        title: 'Bid Yield',
        x: dataBidYield['timeOpen'].values,
        y: dataBidYield['bidRate'].values,
        style: {line: 'green'},
    }
    const seriesAskYield = {
        title: 'Ask Yield',
        x: dataAskYield['timeOpen'].values,
        y: dataAskYield['askRate'].values,
        style: {line: 'red'},
    }
    lineYields.setData([seriesBidYield, seriesAskYield])

    screen.render()
}


async function showDetailWindow(indexTable) {
    screen = blessed.screen()
    screen.program.clear()
    const grid = new contrib.grid({rows: 100, cols: 100, screen: screen})

    const bondItem = bondDataDF.iloc({rows: [indexTable]})
    const name = `${bondItem['Type'].values[0]} ${bondItem['Maturity'].values[0]} [${bondItem['Name'].values[0]}]`

    const paramsLinePrices = {
        style: {text: "white", baseline: "black"},
        xLabelPadding: 3,
        xPadding: 5,
        showLegend: true,
        wholeNumbersOnly: false,
        label: `Price History, ${name}`,
    }
    const paramsLineYields = {
        style: {text: "white", baseline: "black"},
        xLabelPadding: 3,
        xPadding: 5,
        showLegend: true,
        wholeNumbersOnly: false,
        label: `Yield History, ${name}`,
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

    msg.display("\n  Keyboard shortcuts:\n\n\t∙ [R] to update history data\n\t∙ [Escape] to return to the main view\n\t∙ [Ctrl]+[C] to exit the application\n\t∙ any key to dismiss this message\n", -1)

    await updateHistoryData(indexTable)

    screen.key(['r'], async function(ch, key) {
        await updateHistoryData(indexTable);
    });
}


module.exports = {
    showMainWindow,
}
