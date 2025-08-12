CREATE DATABASE pd_jackson_florez_gosling;
USE pd_jackson_florez_gosling;

CREATE TABLE IF NOT EXISTS customers (

    customerID INT AUTO_INCREMENT PRIMARY KEY,
    customerName VARCHAR(100) NOT NULL,
    CustomerAddress VARCHAR(100),
    telephone VARCHAR(100),
    email VARCHAR(100) NOT NULL

);

CREATE TABLE IF NOT EXISTS transactions (

    transactionID INT AUTO_INCREMENT PRIMARY KEY,
    customerID INT,
    FOREIGN KEY (customerID) REFERENCES customers(customerID)
    dateOfTransaction TIMESTAMP(100),
    TransactionAmount INT NOT NULL,
    transactionState VARCHAR(100) NOT NULL
    TransactionType VARCHAR(100) NOT NULL
    platformUsed VARCHAR(100) NOT NULL

);

CREATE TABLE IF NOT EXISTS bills (

    billID INT AUTO_INCREMENT PRIMARY KEY,
    transactionID INT,
    FOREIGN KEY (transactionID) REFERENCES transactions(transactionID)
    billingPeriod TIMESTAMP(100),
    invoicedAmount INT NOT NULL,
    amountPaid INT NOT NULL
);

