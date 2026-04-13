const mongoose = require('mongoose')

const ledgerSchema = new mongoose.Schema({
    account : {
        type  : mongoose.Schema.Types.ObjectId,
        ref : "account",
        required : [true, "Ledger entry must be associated with an account"],
        index : true,
        immutable : true
    },
    ammount : {
        type : Number,
        required : [true, "Amount i required for creating a ledger entry"],
        immutable : true
    },
    transaction : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "transaction",
        required : [true, "Ledger entry must be associated with a transaction"],
        index : true, 
        immutable : true
    },
    type : {
        type : String,
        enum : {
            values : ["Credit", "Debit"],
            message : "Ledger entry type should be either Credit or Debit"
        },
        required : [true, "Ledger entry type is required"],
        immutable : true
    }
    
})


function preventLedgerModification() {
    throw new Error("Ledger entries cannot be modified once created")
}


ledgerSchema.pre("findOneAndUpdate", preventLedgerModification)
ledgerSchema.pre("updateOne", preventLedgerModification)
ledgerSchema.pre("deleteOne", preventLedgerModification)
ledgerSchema.pre("remove", preventLedgerModification)
ledgerSchema.pre("deleteMany", preventLedgerModification)
ledgerSchema.pre("findOneAndDelete", preventLedgerModification)
ledgerSchema.pre("updateMany", preventLedgerModification)
ledgerSchema.pre("findOneAndReplace", preventLedgerModification)

const ledgerModel = mongoose.model("ledger", ledgerSchema)

module.exports = ledgerModel