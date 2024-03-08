# bd-05-pp-treasurydata

Personal project:
> Build a personal project on your own, completely from scratch, then submit it to the community for feedback. You're allowed to use any languages and frameworks you want, but you must build it yourself. The purpose of this project is two-fold: a chance to put your skills into practice and to add another project to your portfolio. Well-built personal projects will help you land interviews and jobs, so make sure to put in the effort!

# treasurydata

This console application scrapes the Brazilian Treasury Direct website and shows a table with basic data about the available government bonds.

## Installation and use

Clone this repository with:

```bash
git clone https://github.com/danilogalisteu/bd-05-pp-treasurydata.git
```

The application uses [`node.js`](https://nodejs.org/en/) as the Javascript runtime, [`nvm`](https://github.com/nvm-sh/nvm) for runtime version management and `npm`for package dependency management.

To initialize the application environment, change to the `bd-05-pp-treasurydata` folder, run:
```bash
nvm use
```
to activate the correct version of `node`, and run:
```bash
npm install
```
to install all dependencies. The application depends on the following packages:
* `puppeteer` for web scraping (requires Google Chrome available on the system);
* `blessed`and `blessed-contrib` for the graphical user interface package; and
* `danfojs-node` for data manipulation.

Its tests depend on the `jest`package.

Run the application with:
```bash
npm start
```

Tests can be run with:
```bash
npm test
```
