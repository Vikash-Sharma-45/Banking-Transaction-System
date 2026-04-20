const {Router} = require('express')

const authMiddleware = require("../middlewares/auth.middleware")

const transactionController = require('../controllers/transaction.controller')

const transactionRoutes = Router()

/**
 * - POST /api/transactions
 * - Create a new transaction
 */

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * - POST /api/transactions/system/initial-fund
 * - Create a new transaction for transferring initial fund to system user
 */

transactionRoutes.post("/system/initial-fund", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;