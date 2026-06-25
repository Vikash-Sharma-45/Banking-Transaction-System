const transationRoutes = require('../routes/transaction.routes');
const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const accountModel = require('../models/account.model')
const emailService = require('../Services/email.service')
const mongoose = require('mongoose')

/**
 * - Create a new transaction
 * - THE 10 STEP TRANSFER FLOW : 
        * 1. Validate the request 
        * 2. Validate idempotency key
        * 3. Check account status
        * 4. Derive sender balance from ledger
        * 5. Create Transaction(pending)
        * 6. Create DEBT Ledger Entry   
        * 7. Create CREDIT Ledger Entry
        * 8. Mark Transaction Completed
        * 9. Commit MongoDB Session
        * 10. Send Email Notification
 */



async function createTransaction(req, res) {

    /**
     * 1. Validate Request
     */

    const {fromAccount, toAccount, amount, idempotencyKey} = req.body

    if(!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message : "fromAccount, toAccount, amount and idempotencyKey are required for creating a transaction"
        })
    }

    const fromUserAccount = await accountModel.findById({
        _id : fromAccount,
    })

    const toUserAccount = await accountModel.findById({
        _id : toAccount,
    })

    if(!fromAccount || !toAccount) {
        return res.status(400).json({
            message : "Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2. Validate Idempotency Key
     */

    const isTransactionAllreadyExists = await transactionModel.findOne({
        idempotencyKey : idempotencyKey
    })

    if(isTransactionAllreadyExists) {

        if(isTransactionAllreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message : "Transaction alrady processed",
                transaction : isTransactionAllreadyExists
            })
        } 

        if(isTransactionAllreadyExists.status === "PENDING"){
            return res.status(200).json({
                message : "Transaction is in processing"
            })
        }

        if(isTransactionAllreadyExists.status === "FAILED") {
            return res.status(500).json({
                message : "Transaction is Failed , Please try"
            })
        }

        if(isTransactionAllreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message : "Transaction is Reversed,Please retry"
            })
        }
        
    }

    /**
     * 3. Check Account Status
     */

    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message : "Both fromAccount and toAccount should be ACTIVE to process the transaction"
        })
    }

    /**
     * - 4. Derive sender balance from ledger
     */

    const balance = await fromUserAccount.getBalance()

    if(balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Required balance is ${amount}`
        })
    }

    /**
     * - 5. Create Transaction (Pending)
     */
    let transaction;
    try {
    const session = await transactionModel.startSession()
    session.startTransaction()

    transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status : "PENDING"
    }], {session}))[0]

    const debitLedgerEntry = await ledgerModel.create([{
        account : fromAccount,
        amount : amount,
        transaction : transaction._id,
        type : "DEBIT",
        
    }], {session})

    await (() =>{
        return new Promise((resolve, reject) => setTimeout(resolve, 100 * 1000));
    })

    const creditLedgerEntry = await ledgerModel.create({
        account : toAccount,
        amount : amount,
        transaction : transaction._id,
        type : "CREDIT",

    }, {session})

    await transactionModle.findOneAndUpdate(
        { _id : transaction._id},
        {status : "COMPLETED"},
        {session}
    )
    

    await session.commitTransaction()
    session.endSession()
} catch(err) {
    await transactionModel.findOneAndUpdate(
        {_id : transaction._id},
        {status: "FAILED"}
    )
    return res.status(400).json({
        message : "Transaction is PENDING due to some error, Please try again",
    })
}

    /**
     * - 10. Send Email Notification
     */

    emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
    return res.status(201).json({
        message : "Transaction Completed Successfully",
        transaction : transaction
    })
}

async function createInitialFundsTransaction(req, res) {
    const {toAccount, amount, idempotencyKey} = req.body

    if(!toAccount || !amount || !idempotencyKey){

        return res.status(400).json({
            message : "toAccount, amount and idempotencyKey are required for creating a transaction"
        })

    } 

    const toUserAccount = await accountModel.findOne ({
        _id : toAccount
    })

    if(!toUserAccount) {
        return res.status(400).json({
            message : "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        // systemUser : true,
        user : req.user._id
    })

    if(!fromUserAccount) {
        return res.status(400).json({
            message : "System User Account not found for the user"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount : fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status : "PENDING"
    
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account : fromUserAccount._id,
        amount : amount,
        transaction : transaction._id,
        type : "DEBIT"
    }], {session})

    const creditLedgerEntry = await ledgerModel.create([{
        account : toUserAccount._id,
        amount : amount,
        transaction : transaction._id,
        type : "CREDIT"
    }], {session})

    transaction.status = "COMPLETED"
    await transaction.save()
    
    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message : "Initial Fund Transaction Completed Successfully",
        transaction : transaction
    })

    

}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}