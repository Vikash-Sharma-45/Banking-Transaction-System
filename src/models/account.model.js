const express = require("express")
const mongoose = require("mongoose")
const ledgerModel = require('./ledger.model')


const accountSchema = new mongoose.Schema( {
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : [true, "Account Must be associated with a user"],
        index : true
    }, 
    status : {
        type : String,
        enum : {
            values : ["ACTIVE", "FROZEN", "CLOSED"],
            message : "Status should be either ACTIVE, FROZEN or CLOSED"  
        },
        default : "ACTIVE"
    },
    currency : {
        type : String,
        required : [true, "Currency is Required for creating an account"],
        default : "INR"
    }

}, {
    timestamps : true
})

accountSchema.index({user : 1, status : 1})

accountSchema.methods.getBalance = async function(){
    const balanceData = await ledgerModel.aggregate([
        { $match : {account : this._id}},
        {
            $group : {
                _id : null,
                totalDebt : {
                    $sum : {
                        $cond : [
                            {$eq : ["type", "Debit"]},
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit : {
                    $sum : {
                        $cond : [
                            {$eq : ["type", "Credit"]},
                            "$amount",
                            0
                        ]
                    }
                }
                
            }
        },

        {
            $project : {
                    _id : 0,
                    balance : {$subtract : ["$totalCredit", "$totalDebt"]}
            }
        }
        
    ])

    if(balanceData.length === 0 ){
        return 0
    }

    return balanceData[0].balance
}

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel