var db = require('../config/connection')
var collection = require('../config/colllections')
const ObjectId = require("mongodb").ObjectId;
const bcrypt = require('bcrypt')
const { response } = require('../app');
const { Db } = require('mongodb');
const transId = "630254df7eb9b85e3b68eead"
// let moment =require('moment')

const colllections = require('../config/colllections');
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_agUUKt0G4SGJAR',
    key_secret: 'jrGVYT5eyPcrfR8JqxEbbDzv' })

const paypal = require('paypal-rest-sdk');
const { resolveCaa } = require('dns');
const { resolve } = require('path');
const { log } = require('console');
const moment = require('moment');
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'Ae6Ap4DXAchKX0YfCvhOtXIZMgCpPxl9ZRF6MFLKO2rSmn1nFlhWBsiy7vOCtz530O73l8HD-hRBljbY',
    'client_secret': 'EJIFhrPfmWlfeuknFXDSyX-lGzItqu_ZqVwF1r3WD-P_Ehe3PJR0YOvN6kqgr-WdZGTb63rDLecVB_Z1'
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData, { active: true }).then((data) => {
                resolve(userData)

            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let activestatus
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email: userData.Email})
            if(user){

                if (user.active) {
                    bcrypt.compare(userData.Password, user.Password).then((status) => {
                        if (status) {
                            console.log("Login Success");
                        response.user = user;
                        response.status = true;
                        resolve(response)
                    } else {
                        console.log("Login failed");
                        response.message = "Invalid username / password"
                        response.status = false
                        resolve(response)
                    }
                })
            } else {
                console.log("Login Failed user Blocked");
                response.message = "Blocked user"
                resolve(response)
            }
            }
            //response.status = false
            //resolve(response)
            
        })
    },
    addToCart: (proId,userId)=>{
        console.log('ghghh');
        console.log(proId);
        let proObj={
            item:ObjectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart= await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(userCart){
            let proExist=userCart.products.findIndex(product=>product.item==proId)
           
            if(proExist!=-1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }
                ).then(()=>{
                    console.log("You are inside - proExist!=-1");
                    resolve()
                })
            }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId)},
            {
                $push:{products:proObj}
            }
            ).then((response)=>{
                console.log('You are inside $push');
                resolve()
            })
            }
            }else{
                let cartObj={
                    user:ObjectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    // addToCart: (proId,userId) => {
    //     let proObj = {
    //         item: ObjectId(proId),
    //         quantity: 1
    //     }
    //     return new Promise(async (resolve, reject) => {
    //         let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
    //         if (userCart) {
    //             let proExist = userCart.products.findIndex(product => product.item == proId)
    //             console.log('you are here inside addToCart proexist');
    //             console.log(proExist);
    //             if (proExist != -1) {
    //                 db.get().collection(collection.CART_COLLECTION)
    //                     .updateOne({ user:ObjectId(userId) ,'products.item': ObjectId(proId) },
    //                         {
    //                             $inc: {'products.$.quantity':1}
    //                         }
    //                     )
    //                     .then(() => {
    //                         resolve()
    //                     })
    //             } else {
    //                 db.get().collection(collection.CART_COLLECTION)
    //                     .updateOne({ user: ObjectId(userId) },
    //                         {
    //                             $push: { products: proObj }
    //                         }
    //                     ).then((response) => {
    //                         resolve()
    //                     })
    //             }
    //         } else {
    //             let cartObj = {
    //                 user: ObjectId(userId),
    //                 products: [proObj]
    //             }
    //             db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
    //                 resolve()
    //             })
    //         }
    //     })
    // },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]} 
                    }
                }
            ]).toArray()
            //  console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
            //console.log(cartItems);
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
     changeProductQuantity:(details)=>{ 
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)

        return new Promise (async (resolve, reject) => {
            if(details.count == -1 && details.quantity ==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:ObjectId(details.cart)},
                {
                    $pull: {products:{item:ObjectId(details.product)}}
                 }
                 ).then((response)=>{
                    resolve({removeProduct:true})
                 })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }
                    ).then((response)=>{
                        resolve({status:true})
                    })  
            }
        })
    },  
    removeIndvPrdt:(CandP)=>{
        return new Promise (async (resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:ObjectId(CandP.cart)},
                {
                    $pull: {products:{item:ObjectId(CandP.product)}}
                 }
                 ).then((response)=>{
                    resolve({productRemovedonBtn:true})
                 })
        })
    },
    getTotalAmount:(userId)=>{
        console.log("4444444444444444444");
        return new Promise(async (resolve,reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]} 
                    }
                },
                {
                    $group:{ 
                        _id:null,
                        total:{$sum:{$multiply:['$quantity',{$toInt:'$product.SellingPrice'}]}}
                    }   
                }
            ]).toArray()
            console.log("This is total: " + total[0].total);
            console.log("At the bottom of get total amount");
            resolve(total[0].total)
        })
    },
    placeOrder:(order,products,total)=>{
         return new Promise((resolve,reject)=>{
            console.log(order,products,total);
            let status
            if(order['payment-method']==='COD'){
                status = 'PLACED'

                // cart remove code here
            }else if(order['payment-method'] === 'wallet'){
                status = 'PLACED'
            }else if(order['payment-method']==='Razorpay'){
                status = 'PENDING'
            }else{
                status ='PENDING'
            }
            let orderObj = {
                deliveryDetails:ObjectId(order.address),
                userId:ObjectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                amountoffbycoupon:parseInt(order.amountoffbycpn),
                amountoffbywallet:parseInt(order.amountoffbywallet),
                date:new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{ //response given to razorpay
                db.get().collection(collection.CART_COLLECTION).deleteOne({user: ObjectId(order.userId)})
                resolve(response.insertedId)
            })
         })
    },  
    getCartProductList:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            console.log(userId);
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            console.log("cart cart cart");
            console.log("Getting cart Product List "+cart);
            resolve(cart.products)

        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        userId:ObjectId(userId)
                    }
                },
                {
                    $project:{
                    deliveryDetails:1,userId:1,paymentMethod:1,products:1,totalAmount:1,status:1,amountoffbycoupon:1,amountoffbywallet:1,date: { $dateToString: { format: "%d-%m-%Y T%H:%M", date: "$date", timezone: "GMT" } }
                    }
                },
                {
                    $sort:{
                        _id:-1
                    }
                }
            ]).toArray()
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async (resolve,reject)=>{
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            console.log(orderItems)
            resolve(orderItems)
        })
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise ((resolve,reject)=>{
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                if(err){
                    console.log(err);
                }else{
                    console.log("New Order: " + order);
                    resolve(order);
                }
              });
        })
    },
    verifyPayment:(details)=>{
         return new Promise ((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256','jrGVYT5eyPcrfR8JqxEbbDzv')

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
         })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status:'PLACED'
                }
            }
            ).then(()=>{

                // db.get().collection(collection.ORDER_COLLECTION).findOne({_id:ObjectId(orderId)}).then((response)=>{
                //     //console.log("Chimi changas" + JSON.stringify(response));
                //     db.get().collection(collection.TRANSACTIONS_COLLECTION).updateOne({_id:ObjectId(transId)},{
                //             $push : {transactions:response}
                //     }).then(()=>{
                //         resolve()
                //     })
                // })
                resolve()


                // db.get().collection(collection.TRANSACTIONS_COLLECTION).insertOne({order_id:ObjectId(orderId)}).then(()=>{

                //     resolve()
                // })


            })
             
        })
    },
    genaratePaypal: (orderId, total) => {
        return new Promise((resolve, reject) => {
          console.log('orderid is  '+ orderId +' Total is ' + total);
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "Red Sox Hat",
                            "sku": "001",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "Hat for the best team ever"
                }] 
            };
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    resolve(payment)
                }
            });
      
        })
      
      },
      addAddress:(details)=>{
                return new Promise((resolve, reject) => {
                    db.get().collection(collection.ADDRESS_COLLECTION).insertOne(
                        {
                            userId:ObjectId(details.userId),
                            address: details.address,
                            mobile: details.mobile,
                            pincode: details.pincode
                        }
                    )
                    .then(() => {
                        resolve();
                    })
                })

      },
      getAllAddress:(userId)=>{
        return new Promise((resolve, reject) => {
           db.get().collection(collection.ADDRESS_COLLECTION)
            .find({userId:ObjectId(userId)})
            .toArray()
            .then((addresses)=>{
                resolve(addresses);
                console.log(addresses);
                console.log("at bottom of address list");
            })
           // resolve(orders)
        })
    },
    getOneAddress:(addressId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({_id:ObjectId(addressId)})
            .then((thatoneaddress)=>{
                // console.log(thatoneaddress);
                resolve(thatoneaddress)
            })
    })
    },
    editoneAddress:(addressId,details)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({_id:ObjectId(addressId)},{
            $set:{
                address:details.address,
                mobile:details.mobile,
                pincode: details.pincode
            }
        })
        .then(()=>{
            resolve()
        })
        })
    },
    deleteOneaddress:(addressId)=>{
        return new Promise(async(resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({_id:ObjectId(addressId)}).then(()=>{
                resolve()
            })
        })
    },
    getUserDetails:(userId)=>{
        return new Promise((resolve, reject)=> {
            db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(userId)})
            .then((response)=>{
               // console.log("At the bottom of getUserDetails");
               // console.log(response);
                resolve(response)
            }).catch((err)=>{
                console.log("Unga bunga noises");
                reject(err)
            })
        })
    },
    editUserDetail:(usrId, usrDetails)=>{
        return new Promise(async (resolve, reject) => {
            let pass;
            if (usrDetails.Password == '') {
                let passw = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(usrId) })
                pass = passw.Password
            } else {
                usrDetails.Password = await bcrypt.hash(usrDetails.Password, 10)
                pass = usrDetails.Password
            }
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(usrId) }, {
                $set: {
                    Name: usrDetails.Name,
                    Email: usrDetails.Email,
                    Password: pass
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    addToWishlist:(proId,userId)=>{
        let userI=ObjectId(userId)
        console.log("Kkkkkkkkkkkkkkkkkkkooooooo");
        return new Promise (async (resolve, reject) => {
            let wishlistexist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({userI:ObjectId(userId)})
             console.log(wishlistexist);
            if(wishlistexist){
                console.log('wishlist for current user exist');
                let proexist = wishlistexist.products.findIndex(product => product== proId)
                console.log('This is the value of proexist'+ proexist);
                if(proexist!=-1){
                       console.log('Wishlist productExist already in product array : Will not insert');
                       db.get().collection(collection.WISHLIST_COLLECTION).updateOne({userI:ObjectId(userId)},{
                        $pull:{
                            products:ObjectId(proId)
                        }
                    }).then(()=>{
                        console.log("Since product already in cart , Removed it");
                        resolve()
                    })
                }else{
                    console.log('product does not Exist in wishlist');
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({userI:ObjectId(userId)},{
                        $push:{
                            products:ObjectId(proId)
                        }
                    }).then(()=>{
                        console.log("Since product not in cart , Pushed it");
                        resolve()

                    })
                }
            }else{
                console.log('wishlist document for current user does not exist');
                console.log('wishlist document for current user does not exist');
                let wishObj={
                    userI:userI,
                    products:[]
                }
                wishObj.products.push(ObjectId(proId))
                 db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getWishlistCount:(userId)=>{
        return new Promise (async (resolve,reject)=>{
            let wcount = 0
            let wishcart =await  db.get().collection(collection.WISHLIST_COLLECTION).findOne({userI:ObjectId(userId)})
            console.log("This is the document wishcart object");
            console.log(wishcart);
            if(wishcart){
                wcount = wishcart.products.length
            }
            resolve(wcount)
        })
        },
    // ,
    // getallWishitems:(userId)=>{
    //     return new Promise ((resolve,reject)=>{
    //         db.get().collection(collection.WISHLIST_COLLECTION).findOne({userI:ObjectId(userId)})
    //         .then((response)=>{
    //             console.log("log of getallWishitems");
    //             console.log(response);
    //             resolve(response)
    //         })
    //     })
    // }
    getWishlistproducts:(userId)=>{
         return new Promise(async(resolve,reject)=>{
            let wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match:{ userI: ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'products',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                            product:{$arrayElemAt:['$product',0]} 
                    }
                }
            ]).toArray()
            console.log('AT the bottom ');
           console.log(wishlistItems);
            resolve(wishlistItems)
         })
    },
    setStatusreturn:(orderId)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
          {$set:
            {
            status:'RETURN'
            }
          }
          ).then((response)=>{
            resolve(response)
          })
        })
      },
      setStatuscancel:(orderId,userId)=>{
        return new Promise(async (resolve,reject)=>{
            let ordDtls =await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:ObjectId(orderId)})
            console.log( "this is the ordDtls" + ordDtls);
          db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
          {$set:
            {
            status:'CANCEL'
            }
          }
          ).then((response)=>{
            db.get().collection(collection.WALLET_COLLECTION).findOne({userId:ObjectId(userId)}).then((response)=>{
                if(response){
                    console.log("User wallet collection & DOCUMENT was found");
                    // let expirationDate=moment().add(100 ,'d')
                    let orderObj = {
                        orderId: ObjectId(orderId),
                        totalAmount: parseInt(ordDtls.totalAmount),
                        status:true,
                        transactionTime:moment().format()
                        // expirationDate:expirationDate.format()
                    }

                    let newWallettotal = parseInt(response.walletTotal) + parseInt(ordDtls.totalAmount)

                    db.get().collection(collection.WALLET_COLLECTION).updateOne({userId:ObjectId(userId)},{
                        $push:{
                            wallethistory:orderObj  
                        }
                    }).then(()=>{
                        console.log("orderObj was pushed into the wallethistory array\n");
                        db.get().collection(collection.WALLET_COLLECTION).updateOne({userId:ObjectId(userId)},{
                            $set:{
                                walletTotal:newWallettotal
                            }
                        }).then(()=>{
                            console.log("New total calculated and set/Updated in walletTotal");
                            resolve()
                        })
                    })
                }else{ // Inital case where order is cancelled
                    console.log("User wallet collection was not found");
                    let orderObj = {
                        orderId: ObjectId(orderId),
                        totalAmount: parseInt(ordDtls.totalAmount),
                        status:true,
                        transactionTime:moment().format()
                        // expirationDate:moment(transactionTime).add(100 ,d)
                    }
                    let walletObj = {
                        userId:ObjectId(userId),
                        walletTotal: parseInt(ordDtls.totalAmount),
                        wallethistory:[orderObj]
                    } // creates a new object and pushes the new object into the WALLET COLLECTION
                    db.get().collection(collection.WALLET_COLLECTION).insertOne(walletObj).then(()=>{
                        resolve()
                    })
                }
            })
          })
        })
    
      },
        applyCoupon:(details)=>{ // CHECKS IF userId is in the particular coupon collection 
        let userId  = details.usrid
        console.log("This is user Id " + userId);
        let couponcode= details.appliedcoupon
        console.log("Trial 1");
        return new Promise(async(resolve,reject)=>{
            let couponexist = await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:couponcode})
            if(couponexist){
                console.log("Coupon Exist");
                let couponstatus = await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:couponcode,status:true})
                if(couponstatus){
                    let userusedCoupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:couponcode,status:true,userUser:{ $nin:[ObjectId(userId)]}})
                    console.log("Coupon Status is True");
                    // console.log(userusedCoupon);
                    if(userusedCoupon){
                        console.log("Users initial use of coupon, can be applied");
                        db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:couponcode,status:true,userUser:{$nin:[ObjectId(userId)]}}).then((userusedCoupon)=>{
                            userusedCoupon.couponapplied=true
                            resolve(userusedCoupon)
                        })
                        
                    }else{
                        console.log("User has already used coupon and hence cannot apply");
                        let userusedCoupon ={}
                        userusedCoupon.couponapplied=false
                        resolve(userusedCoupon)
                    }
                }else{
                    console.log("Coupon Status is False");
                    let couponstatus ={}
                    couponstatus.couponstate = false
                    resolve(couponstatus)
                }
            }else{
                console.log("No Such Coupon Exist");
                let couponexist = {}
                couponexist.isCouponcorrect = false
                resolve(couponexist)
            }
        })
    },
    checkifCouponApplied:(couPon,userId)=>{  // push userId to the particular coupon document , gets the percent off amount , 
        let offpercent
        let cname
        return new Promise (async (resolve,reject)=>{
          let userappliedcoupon = await  db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:couPon,userUser:{$nin:[ObjectId(userId)]}})
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
          console.log(userappliedcoupon);
          if(userappliedcoupon){
            console.log("Scenario 1 ");
            offpercent = userappliedcoupon.offpercent
            cname = userappliedcoupon.coupon

            if(userappliedcoupon){
            //   let checkcouponIncart = await db.get().collection(collection.COUPON_COLLECTION).updateOne({coupon:ObjectId(userappliedcoupon._id)},{
              let checkcouponIncart = await db.get().collection(collection.COUPON_COLLECTION).updateOne({coupon:couPon},{
                $push:{
                    userUser:ObjectId(userId)
                }
              })
              console.log("UserId pushed to coupon collection AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
              if(checkcouponIncart){
                  checkcouponIncart.couponapplied = true
                  checkcouponIncart.offpercent = offpercent
                  checkcouponIncart.cname= cname
                  console.log("Am I in here");
                  resolve(checkcouponIncart)
              }else{
                resolve(null)
              }
            }
          }else{
            console.log("Scenario 2");
            resolve(null)
          }
        })
    },
    NumberExist: (phone) => {
        return new Promise(async (resolve, reject) => {
          let user = await db.get().collection(collection.USER_COLLECTION).findOne({ number:phone });
            
          if (user == null) {
             console.log("login faild");
             resolve({ userExist: false,});
          } else {
            resolve({userExist:true,user});
          }
        });
      },
      getBannerImage:()=>{
          return new Promise ((resolve,reject)=>{
            db.get().collection(collection.BANNER_COLLECTION).find().toArray().then((response)=>{
                resolve(response)
            })
        })
      },
    //   getBill :(ordId)=>{
    //     return new Promise ((resolve,reject)=>{
    //         db.get().collection(collection.ORDER_COLLECTION).findOne({_id:ObjectId(ordId)}).then((oneordr)=>{
    //             console.log("Top of here");
    //             console.log(oneordr);
    //             resolve(oneordr)
    //         })
    //     })
    //   },
      getBill :(ordId)=>{
        return new Promise ( async (resolve,reject)=>{
            let bill =await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        _id:ObjectId(ordId)
                    }
                },
                {
                    $lookup:{
                        from:collection.USER_COLLECTION,
                        localField:'userId',
                        foreignField:'_id',
                        as:"name"
                    }
                },
                {
                    $lookup:{
                        from:collection.ADDRESS_COLLECTION,
                        localField:'deliveryDetails',
                        foreignField:'_id',
                        as:"address"
                    }
                },
                {
                    $project:{
                        userId:0,deliveryDetails:0
                    }
                },
                {
                    $unwind:"$products"
                }
                ,
                {
                    $project:{
                        product:"$products.item",quantity:"$products.quantity",paymentMethod:1,totalAmount:1,status:1,date:1,name: {$arrayElemAt:['$name' ,0]}, address:{$arrayElemAt:['$address',0]},amountoffbycoupon:1,amountoffbywallet:1
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'product',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        paymentMethod:1,totalAmount:1,status:1,date:1,product:{$arrayElemAt:['$product' ,0]},quantity:1,name:1,address:1,amountoffbycoupon:1,amountoffbywallet:1
                        
                    }
                },
                {
                    $project:{
                        paymentMethod:1,totalAmount:1,status:1,date:1,product:1,quantity:1,name:1,address:1,amount:{
                            $multiply:["$quantity",{$toInt:"$product.SellingPrice"}]
                        },amountoffbycoupon:1,amountoffbywallet:1
                        
                    }
                }

            ]).toArray()
            console.log("Under thsi");
            resolve(bill)
        })
      },
      getSubtotal:(ordId)=>{
        return new Promise ( async (resolve,reject)=>{
            let bill =await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        _id:ObjectId(ordId)
                    }
                },
                {
                    $lookup:{
                        from:collection.USER_COLLECTION,
                        localField:'userId',
                        foreignField:'_id',
                        as:"name"
                    }
                },
                {
                    $lookup:{
                        from:collection.ADDRESS_COLLECTION,
                        localField:'deliveryDetails',
                        foreignField:'_id',
                        as:"address"
                    }
                },
                {
                    $project:{
                        userId:0,deliveryDetails:0
                    }
                },
                {
                    $unwind:"$products"
                }
                ,
                {
                    $project:{
                        product:"$products.item",quantity:"$products.quantity",paymentMethod:1,totalAmount:1,status:1,date:1,name: {$arrayElemAt:['$name' ,0]}, address:{$arrayElemAt:['$address',0]},amountoffbycoupon:1,amountoffbywallet:1
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'product',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        paymentMethod:1,totalAmount:1,status:1,date:1,product:{$arrayElemAt:['$product' ,0]},quantity:1,name:1,address:1,amountoffbycoupon:1,amountoffbywallet:1
                        
                    }
                },
                {
                    $group:{
                        _id:null,
                        Subtotal:{ $sum:{ $multiply:["$quantity",{$toInt:"$product.SellingPrice"}]}}
                        
                    }
                }

            ]).toArray()
            console.log("new subtotal");
            // console.log(bill);
            resolve(bill[0].Subtotal)
        })
      },
      doSearchinProduct:async (key) =>{
        return new Promise (async (resolve,reject)=>{
            let searchResult = await db.get().collection(collection.PRODUCT_COLLECTION)
        .find({
            ProductName: { $regex: key, $options: 'i'}
        }).toArray()

        console.log("At the top of searchResult");
        console.log(searchResult)
        resolve(searchResult)
        })
      }


}

// applyCoupon:(details)=>{
//     let userId  = details.usrid
//     let couponcode= details.appliedcoupon
//     console.log("Trial 1");
//     return new Promise(async(resolve,reject)=>{
//         let couponexist = await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:couponcode})
//         if(couponexist){
//             console.log("Coupon Exist");
//             let couponstatus = await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:couponcode,status:true})
//             if(couponstatus){
//                 console.log("Coupon Status is True");
//                 let userusedCoupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon:couponcode,status:true,userUser:{ $nin:[userId]}})
//                 if(userusedCoupon){
//                     console.log("Users initial use of coupon");
//                     console.log("Hence coupon can be applied");

//                     resolve()
//                 }else{
//                     console.log("User has already used coupon and hence cannot apply");
//                 }
//             }else{
//                 console.log("Coupon Status is False");
//             }
//         }else{
//             console.log("No Such Coupon Exist");
//         }
//     })
// }
