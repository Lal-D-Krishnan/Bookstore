var db = require('../config/connection')
var collection= require('../config/colllections')
var ObjectId=require('mongodb').ObjectId
const { response } = require('../app')

module.exports={
    // order status PLACED push into transactions array - tranaction_status : DEBITED , $inc totalAmount
    getTransactiondetails:()=>{
        return new Promise (async (resolve,reject)=>{
         let orders = await   db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $lookup:{
                from:collection.USER_COLLECTION,
                localField:'userId',
                foreignField:'_id',
                as:"name"
                    }
                   }
                   ,{
                    $project:{
                      deliveryDetails:1,userId:1,paymentMethod:1,products:1,totalAmount:1,status:1,date:1
                      ,name:1
                    }
                   },
                   {
                    $project:{
                      deliveryDetails:1,userId:1,paymentMethod:1,products:1,totalAmount:1,status:1,date:{ $dateToString: { format: "%d-%m-%Y T%H:%M", date: "$date", timezone: "GMT" }}
                      ,name:1
                    }
                   }
                   ,
                   {
                    $lookup:{
                      from:collection.ADDRESS_COLLECTION,
                      localField:'deliveryDetails',
                      foreignField:'_id',
                      as:'address'
                    }
                   },
                   {
                    $project:{
                        deliveryDetails:1,userId:1,paymentMethod:1,products:1,totalAmount:1,status:1,date:1, name:1,address:1,
                        transactionstatus:{
                            $cond:{if: {
                                 $or:[  {$and: [{ $eq: ['$paymentMethod',"Razorpay"] }, { $eq: ['$status',"PLACED"] }]} ,{$and: [{ $eq: ['$paymentMethod',"Paypal"] }, { $eq: ['$status',"PLACED"] }] }]
                            }, then : "DEBITED",
                            else: {
                                $cond:{
                                    if: {
                                        $or:[  {$and: [{ $eq: ['$paymentMethod',"Razorpay"] }, { $eq: ['$status',"SHIPPED"] }]} ,{$and: [{ $eq: ['$paymentMethod',"Paypal"] }, { $eq: ['$status',"SHIPPED"] }] }]
                                   }, then : "DEBITED",
                                   else:{
                                        $cond:{
                                            if: {
                                                $or:[  {$and: [{ $eq: ['$paymentMethod',"Razorpay"] }, { $eq: ['$status',"DELIVERED"] }]} ,{$and: [{ $eq: ['$paymentMethod',"Paypal"] }, { $eq: ['$status',"DELIVERED"] }] }]
                                           }, then : "DEBITED",
                                           else:{
                                            $cond :{
                                                if: {
                                                    $or:[  {$and: [{ $eq: ['$paymentMethod',"Razorpay"] }, { $eq: ['$status',"RETURN"] }]} ,{$and: [{ $eq: ['$paymentMethod',"Paypal"] }, { $eq: ['$status',"RETURN"] }] }]
                                               }, then : "CREDITED", 
                                               else:{
                                                    $cond:{
                                                        if: {
                                                            $or:[  {$and: [{ $eq: ['$paymentMethod',"Razorpay"] }, { $eq: ['$status',"CANCEL"] }]} ,{$and: [{ $eq: ['$paymentMethod',"Paypal"] }, { $eq: ['$status',"CANCEL"] }] }]
                                                       }, then : "CREDITED",
                                                       else:{
                                                        $cond:{
                                                            if: {
                                                                   $and:[ { $eq: ['$paymentMethod',"COD"] }, { $eq: ['$status',"DELIVERED"] }]
                                                           }, then : "DEBITED",
                                                           else:{
                                                            $cond:{
                                                                if: {
                                                                    $and:[ { $eq: ['$paymentMethod',"COD"] }, { $eq: ['$status',"RETURN"] }]
                                                            }, then : "CREDITED",
                                                            else:{
                                                                $cond:{
                                                                    if: {
                                                                        $and:[ { $eq: ['$paymentMethod',"COD"] }, { $eq: ['$status',"PLACED"] }]
                                                                }, then : "NO TRANS",
                                                                else:{
                                                                    $cond:{
                                                                        if: {
                                                                            $and:[ { $eq: ['$paymentMethod',"COD"] }, { $eq: ['$status',"SHIPPED"] }]
                                                                    }, then : "NO TRANS",
                                                                    else:"NO TRANS"
                                                                    }
                                                                }

                                                                }
                                                            }
                                                            }
                                                           }
                                                        }
                                                       }
                                                    }
                                               }
                                            }
                                           }
                                        }
                                   }
                                }
                            }
                        }
                    }
                   }
                },
                {
                    $sort:{
                        date:-1
                    }
                }

            ]).toArray()
            // console.log(orders);
            console.log("o0o0o0o0o0o");
            resolve(orders)
        })
        





    // order status CANCEL or RETURN push into tranaction array - tranaction_status : credited , $dec totalAmount
}
}