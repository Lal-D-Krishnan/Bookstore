const db = require('../config/connection')
const collection= require('../config/colllections')
const ObjectId=require('mongodb').ObjectId
const moment = require('moment');

module.exports = {
    getWalletTotal:(uid)=>{
        return new Promise ( async (resolve, reject) =>{
            let wallt = await db.get().collection(collection.WALLET_COLLECTION).findOne({userId:ObjectId(uid)})
            if (wallt){
                resolve(wallt)
            }else{
                console.log("User wallet collection was not found in /place-order");
                let walletObj = {
                    userId:ObjectId(uid),
                    walletTotal: 0,
                    wallethistory:[]
                } // creates a new object and pushes the new object into the WALLET COLLECTION
                db.get().collection(collection.WALLET_COLLECTION).insertOne(walletObj).then((response)=>{
                    // resolve(response.insertedid)
                    db.get().collection(collection.WALLET_COLLECTION).findOne({_id:ObjectId(response.insertedId)}).then((response)=>{
                        resolve(response)
                    })
                })
            }
        })
    },
    walletDdut:(remainingWalletAmt,userId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.WALLET_COLLECTION).updateOne({userId:ObjectId(userId)},
            {
                $set:{
                    walletTotal:remainingWalletAmt  // wallet money updated here
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    // push order details into wallet after buying with wallet money
    walletOrdrpush : (orderId,userId,total)=>{
        let orderObj = {
            orderId: ObjectId(orderId),
            totalAmount: parseInt(total),
            status:false,
            amountusedfromWallet:parseInt(total),
            transactionTime:moment().format()
            // expirationDate:expirationDate.format()
        }
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.WALLET_COLLECTION).updateOne({userId:ObjectId(userId)},{
                $push:{
                    wallethistory:orderObj
                }
            }).then(()=>{
                resolve()
            })
        })

    },
    walletOrdrpushCase2 : (orderId,userId,total,wM)=>{
        let orderObj = {
            orderId: ObjectId(orderId),
            totalAmount: parseInt(total),
            status:false,
            walletmoneyusedpartialy:true,
            amountusedfromWallet:parseInt(wM),
            transactionTime:moment().format()
            // expirationDate:expirationDate.format()
        }
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.WALLET_COLLECTION).updateOne({userId:ObjectId(userId)},{
                $push:{
                    wallethistory:orderObj
                }
            }).then(()=>{
                resolve()
            })
        })

    },
    getWalletHistroy :(id)=>{
        return new Promise (async (resolve ,reject)=>{
           let orders = await db.get().collection(collection.WALLET_COLLECTION).aggregate([
            {
                $match:{
                    userId:ObjectId(id)
                }
            },
            {
                $unwind:'$wallethistory'
            },
            {
                $project:{
                    orderId:'$wallethistory.orderId',
                    totalofOrder:'$wallethistory.totalAmount',
                    orderwalletStatus:'$wallethistory.status',
                    amountusedfromWallet:'$wallethistory.amountusedfromWallet',
                    date:'$wallethistory.transactionTime'
                }
            }
           ]).toArray()
           console.log("Overhereeerer");
           console.log(orders);
           resolve(orders)
        })
    }
}