const transationRoutes = require('../routes/transaction.routes');
const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const accountModel = require('../models/account.model')
const emaolService = require('../Services/email.service')

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

        if(isTransactionAllreadyExists.status === "Completed") {
            return res.status(200).json({
                message : "Transaction alrady processed",
                transaction : isTransactionAllreadyExists
            })
        } 

        if(isTransactionAllreadyExists.status === "Pending"){
            return res.status(200).json({
                message : "Transaction is in processing"
            })
        }

        if(isTransactionAllreadyExists.status === "Failed") {
            return res.status(500).json({
                message : "Transaction is Failed , Please try"
            })
        }

        if(isTransactionAllreadyExists.status === "Reversed") {
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
}