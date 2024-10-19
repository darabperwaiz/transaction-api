# Transaction API's


## Install

$ git clone https://github.com/darabperwaiz/transaction-api.git
$ cd transaction-api
$ npm install

## Running the project

$ npm start

## API's

#### Seed the Database:
GET http://localhost:3000/api/seed

#### List Transactions:
GET http://localhost:3000/api/transactions?month=January&page=1&perPage=10&search=example

#### Get Statistics:
GET http://localhost:3000/api/statistics?month=January

#### Get Bar Chart Data:
GET http://localhost:3000/api/barchart?month=January

#### Get Pie Chart Data:
GET http://localhost:3000/api/piechart?month=January

#### Get Combined Data:
GET http://localhost:3000/api/combined?month=January
