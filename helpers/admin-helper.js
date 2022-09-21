var db = require('../config/connection')
var collection = require('../config/colllections')
var ObjectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')
const { response } = require('../app')
module.exports = {
  doAdminLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {}
      let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminData.Email })
      if (admin) {
        if (admin.Password == adminData.Password) {
          console.log("Login Success");
          response.adminIn = admin;
          response.status = true;
          resolve(response)
        } else {
          console.log("Login failed");
          resolve({ status: false })
        }
      } else {
        console.log("Login Failed Failed");
        resolve({ status: false })
      }
    })
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let listOfUsers = await db.get().collection(collection.USER_COLLECTION).find().toArray()
      resolve(listOfUsers)
    })
  },
  unblockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
        $set: {
          active: true
        }
      }).then((response) => {
        resolve(response)
      })
    })
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
        $set: {
          active: false
        }
      }).then((response) => {
        resolve(response)
      })
    })
  }
  ,
  codProfit: () => {
    return new Promise(async (resolve, reject) => {
      let cdd = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { paymentMethod: "COD"
          // ,status: "DELIVERED"
         }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount"
            }
          }
        }, { $project: { _id: 0, total: 1 } }
      ]).toArray()

      resolve(cdd[0].total)
    })

  },
  razrProfit: () => {
    return new Promise(async (resolve, reject) => {
      let razrt = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { paymentMethod: "Razorpay" }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount"
            }
          }
        }, { $project: { _id: 0, total: 1 } }
        // $project:{
        //   _id:0,total:1
        // }
      ]).toArray()

      resolve(razrt[0].total)
    })
  },
  pplProfit: () => {
    return new Promise(async (resolve, reject) => {
      let pplt = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { paymentMethod: "Paypal" }
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount"
            }
          }
        }, { $project: { _id: 0, total: 1 } }
        // $project:{
        //   _id:0,total:1
        // }
      ]).toArray()
      console.log("At the bottom of ppl profit");
      //console.log(cdd);
      //console.log(cdd[0].total);
      resolve(pplt[0].total)
    })
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION)
        .find({ userId: ObjectId(userId) }).sort({ _id: -1 }).toArray()
      resolve(orders)
    })
  },
  getOneAddress: (addressId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: ObjectId(addressId) })
        .then((thatoneaddress) => {
          console.log(thatoneaddress);
          console.log("ADMIN- at bottom of getoneaddress");
          resolve(thatoneaddress)
        })
    })
  },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { _id: ObjectId(orderId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }
      ]).toArray()
      // console.log(orderItems)
      resolve(orderItems)
    })
  },
  setStatusplaced: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
        {
          $set:
          {
            status: 'PLACED'
          }
        }
      ).then((response) => {
        resolve(response)
      })
    })
  },
  setStatuspending: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
        {
          $set:
          {
            status: 'PENDING'
          }
        }
      ).then((response) => {
        resolve(response)
      })
    })
  },
  setStatusshipped: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
        {
          $set:
          {
            status: 'SHIPPED'
          }
        }
      ).then((response) => {
        resolve(response)
      })
    })
  },
  setStatusdelivered: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
        {
          $set:
          {
            status: 'DELIVERED'
          }
        }
      ).then((response) => {
        resolve(response)
      })
    })
  },
  setStatuscancel: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
        {
          $set:
          {
            status: 'CANCEL'
          }
        }
      ).then((response) => {
        resolve(response)
      })
    })

  },
  addcoupon: (details) => {
    let percent = parseInt(details.offpercent)
    let couponObj = {
      coupon: details.coupon,
      status: true,
      offpercent: percent,
      userUser: []
    }
    return new Promise((resolve, reject) => {
      db.get().collection(collection.COUPON_COLLECTION).insertOne(couponObj).then((response) => {
        resolve(response)
      })
    })
  },
  getAllCoupons: () => {

    return new Promise((resolve, reject) => {
      db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((response) => {
        resolve(response)
      })
    })
  },
  unblockCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: ObjectId(couponId) }, {
        $set: {
          status: true
        }
      }).then((response) => {
        resolve(response)
      })
    })
  },
  blockCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: ObjectId(couponId) }, {
        $set: {
          status: false
        }
      }).then((response) => {
        resolve(response)
      })
    })
  },
  getallOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $lookup: {
            from: collection.USER_COLLECTION,
            localField: 'userId',
            foreignField: '_id',
            as: "name"
          }
        }
        , {
          $project: {
            deliveryDetails: 1, userId: 1, paymentMethod: 1, products: 1, totalAmount: 1, status: 1, date: 1, name: 1
          }
        },
        {
          $project: {
            deliveryDetails: 1, userId: 1, paymentMethod: 1, products: 1, totalAmount: 1, status: 1, date: { $dateToString: { format: "%d-%m-%Y T%H:%M", date: "$date", timezone: "GMT" } }
            , name: 1
          }
        }
        , {
          $lookup: {
            from: collection.ADDRESS_COLLECTION,
            localField: 'deliveryDetails',
            foreignField: '_id',
            as: 'address'
          }
        },
        {
          $sort: {
            date: -1
          }
        }

      ]).toArray()
      resolve(orders)
    })
  },
  addBanners: (bannerimages) => {
    console.log("111111111111111111111");
    console.log(bannerimages);
    return new Promise(async (resolve, reject) => {
      console.log("22222222222222222222");
      let existingImage = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
      let ee = JSON.stringify(existingImage)
      console.log("6767676767676" + ee);

      db.get().collection(collection.BANNER_COLLECTION).updateOne({ _id: existingImage[0]._id }, {
        $set: {
          bannerimages: bannerimages
        }
      }).then((response) => {
        console.log("33333333333333333");
        resolve(response)
      }).catch((error) => {
        console.log("rrrrrrrrrrrrrrrRRRRRRRR");
        console.log(error);
      })
    })

  },
  productCount: () => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).aggregate([

        { $group: { _id: null, n: { $sum: 1 } } }
      ]).toArray().then((response) => {
        console.log("HoooyaHHHHHHHHHH")
        // console.log(response[0].n)

        resolve(response[0].n)
      })

    })
  },
  usrCount: () => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).aggregate([

        { $group: { _id: null, n: { $sum: 1 } } }
      ]).toArray().then((response) => {
        console.log("HoooyaHHHHHHHHHH")
        console.log(response[0].n)

        resolve(response[0].n)
      })

    })
  },
  ordrCount: () => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).aggregate([

        { $group: { _id: null, n: { $sum: 1 } } }
      ]).toArray().then((response) => {
        console.log("HoooyaHHHHHHHHHH")
        // console.log(response[0].n)

        resolve(response[0].n)
      })

    })

  },
  getSubtotalfrmAdm: (ordId) => {
    return new Promise(async (resolve, reject) => {
      let bill = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            _id: ObjectId(ordId)
          }
        },
        {
          $lookup: {
            from: collection.USER_COLLECTION,
            localField: 'userId',
            foreignField: '_id',
            as: "name"
          }
        },
        {
          $lookup: {
            from: collection.ADDRESS_COLLECTION,
            localField: 'deliveryDetails',
            foreignField: '_id',
            as: "address"
          }
        },
        {
          $project: {
            userId: 0, deliveryDetails: 0
          }
        },
        {
          $unwind: "$products"
        }
        ,
        {
          $project: {
            product: "$products.item", quantity: "$products.quantity", paymentMethod: 1, totalAmount: 1, status: 1, date: 1, name: { $arrayElemAt: ['$name', 0] }, address: { $arrayElemAt: ['$address', 0] }, amountoffbycoupon: 1, amountoffbywallet: 1
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'product',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            paymentMethod: 1, totalAmount: 1, status: 1, date: 1, product: { $arrayElemAt: ['$product', 0] }, quantity: 1, name: 1, address: 1, amountoffbycoupon: 1, amountoffbywallet: 1

          }
        },
        {
          $group: {
            _id: null,
            Subtotal: { $sum: { $multiply: ["$quantity", { $toInt: "$product.SellingPrice" }] } }

          }
        }

      ]).toArray()
      // console.log("new subtotal");
      // console.log(bill);
      resolve(bill[0].Subtotal)
    })
  },
  getBillfrmAdm: (ordId) => {
    return new Promise(async (resolve, reject) => {
      let bill = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            _id: ObjectId(ordId)
          }
        },
        {
          $lookup: {
            from: collection.USER_COLLECTION,
            localField: 'userId',
            foreignField: '_id',
            as: "name"
          }
        },
        {
          $lookup: {
            from: collection.ADDRESS_COLLECTION,
            localField: 'deliveryDetails',
            foreignField: '_id',
            as: "address"
          }
        },
        {
          $project: {
            userId: 0, deliveryDetails: 0
          }
        },
        {
          $unwind: "$products"
        }
        ,
        {
          $project: {
            product: "$products.item", quantity: "$products.quantity", paymentMethod: 1, totalAmount: 1, status: 1, date: 1, name: { $arrayElemAt: ['$name', 0] }, address: { $arrayElemAt: ['$address', 0] }, amountoffbycoupon: 1, amountoffbywallet: 1
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'product',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            paymentMethod: 1, totalAmount: 1, status: 1, date: 1, product: { $arrayElemAt: ['$product', 0] }, quantity: 1, name: 1, address: 1, amountoffbycoupon: 1, amountoffbywallet: 1

          }
        },
        {
          $project: {
            paymentMethod: 1, totalAmount: 1, status: 1, date: 1, product: 1, quantity: 1, name: 1, address: 1, amount: {
              $multiply: ["$quantity", { $toInt: "$product.SellingPrice" }]
            }, amountoffbycoupon: 1, amountoffbywallet: 1

          }
        }

      ]).toArray()
      // console.log("Under thsi");
      resolve(bill)
    })
  },
  getallOrdersrange: (sd, ed) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            date: { $gte: sd, $lte: ed }
          }
        },
        {
          $lookup: {
            from: collection.USER_COLLECTION,
            localField: 'userId',
            foreignField: '_id',
            as: "name"
          }
        }
        , {
          $project: {
            deliveryDetails: 1, userId: 1, paymentMethod: 1, products: 1, totalAmount: 1, status: 1, date: 1, name: 1
          }
        },
        {
          $project: {
            deliveryDetails: 1, userId: 1, paymentMethod: 1, products: 1, totalAmount: 1, status: 1, date: { $dateToString: { format: "%d-%m-%Y T%H:%M", date: "$date", timezone: "GMT" } }
            , name: 1
          }
        }
        , {
          $lookup: {
            from: collection.ADDRESS_COLLECTION,
            localField: 'deliveryDetails',
            foreignField: '_id',
            as: 'address'
          }
        },
        {
          $sort: {
            date: -1
          }
        }

      ]).toArray()
      resolve(orders)
    })

  },
  soldCount: () => {
    return new Promise(async (resolve, reject) => {
      let mSp = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
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
            item:1,quantity:1,product:1,prdtName:{$arrayElemAt:['$product',0]}
          }
        },
        {
          $project:{
            item:1,quantity:1,product:1,prdtName:'$prdtName.ProductName'
          }
        },
        {
          $group:{
            _id:'$prdtName',
            count: {$sum:'$quantity'}
          }
        }
      ]).toArray()
      // console.log("Unga Bunga");
      // console.log(mSp);
      // console.log("Unga Bunga");
      resolve(mSp)
    })
  },
  mostSold: () => {
    return new Promise(async (resolve, reject) => {
      let mSold = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $unwind:'$products'
        },
        {
          $project:{item:'$products.item',quantity:'$products.quantity'}
        },
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
        }
        ,
        {
          $project:{
            item:1,quantity:1,product:1,prdtName:{$arrayElemAt:['$product',0]}
          }
        },
        {
          $project:{
            item:1,quantity:1,product:1,prdtName:'$prdtName.ProductName',image:'$prdtName.image'
          }
        }
        ,
        {
          $group:{
            _id:'$prdtName',
            count: {$sum:'$quantity'}
           
          }
        }
        ,
        {
          $group:{
            _id: { productname:'$_id',maxCount: {$max:'$count'}  }
          }
        },
        {
          $sort:{
            "_id.maxCount":-1
          }
        },{
          $project:{
            Prodname:"$_id.productname",maxSold:'$_id.maxCount',_id:0
          }
        }
      ]).toArray()
      console.log("Unga Bunga");
      // console.log(mSold);
      console.log("Unga Bunga");
      resolve(mSold[0])
    })
  },
  mostSoldImg:(k)=>{
    return new Promise ( (resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ProductName:k.Prodname}).then((response)=>{
        resolve(response.image)
      })
    })
  },
  leastSold:()=>{
    return new Promise(async (resolve, reject) => {
      let mSold = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $unwind:'$products'
        },
        {
          $project:{item:'$products.item',quantity:'$products.quantity'}
        },
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
        }
        ,
        {
          $project:{
            item:1,quantity:1,product:1,prdtName:{$arrayElemAt:['$product',0]}
          }
        },
        {
          $project:{
            item:1,quantity:1,product:1,prdtName:'$prdtName.ProductName',image:'$prdtName.image'
          }
        }
        ,
        {
          $group:{
            _id:'$prdtName',
            count: {$sum:'$quantity'}
           
          }
        }
        ,
        {
          $group:{
            _id: { productname:'$_id',maxCount: {$max:'$count'}  }
          }
        },
        {
          $sort:{
            "_id.maxCount":1
          }
        },{
          $project:{
            Prodname:"$_id.productname",maxSold:'$_id.maxCount',_id:0
          }
        }
      ]).toArray()
      resolve(mSold[0])
    })
  },
  leastSoldImg :(k)=>{
    return new Promise ( (resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ProductName:k.Prodname}).then((response)=>{
        resolve(response.image)
      })
    })
  },
  getCatySldcnt:()=>{
    return new Promise (async (resolve,reject)=>{
      let catsldcnt =await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $unwind:'$products'
        },
        {
          $project: { products: '$products.item', quantity: '$products.quantity',  }
        }
        ,
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'products',
            foreignField:'_id',
            as:"productlist"
          }
        },
        {
          $unwind:'$productlist'
        },

        {
          $lookup:{
            from:collection.CATEGORY_COLLECTION,
            localField:'productlist.Category',
            foreignField:'_id',
            as:'category'
          }
        },
        {
          $unwind:'$category'
        }
        ,
        {
          $group:{   _id: { productname:'$category.Category'},count: {$sum:'$quantity'}  }
        },
        {
          $sort:{
            '_id.productname':1
          }
        }

        ,
        {
          $project:{
            Category: '$_id.productname' , count : '$count',_id:0
          }
        }
        // ,
        // {
        //   $group:{ 
        //     _id:{}
        //    }
        // }
      ]).toArray()
      console.log("Confused Ili lllllllllll");
      console.log(catsldcnt);
      console.log("Confused Ili lllllllllll");
      resolve(catsldcnt)
    })
  }
}

