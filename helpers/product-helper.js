var db = require('../config/connection')
var collection= require('../config/colllections')
const { ObjectId } = require('mongodb')
const { response } = require('../app')
const { PRODUCT_COLLECTION } = require('../config/colllections')
//import { BSONTypeError } from "bson"
let objectId=require('mongodb').ObjectId

// 62d9a69b54c4639c7fc6d585 - action advnture
module.exports = {
    addProduct: (product)=>{
        return new Promise(async(resolve,reject)=>{
            let catId = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:ObjectId(product.Category)})
            console.log(catId);
            console.log("Oya hhhhhhhhhhhhhhhh");
            let subcatId = await db.get().collection(collection.SUBCATEGORY_COLLECTION).findOne({_id:ObjectId(product.SubCategory)})

            let proObj = {
                ProductName: product.ProductName,
                Author: product.Author,
                SellingPrice:parseInt(product.SellingPrice),
                Category: ObjectId(catId._id),
                SubCategory: ObjectId(subcatId._id),
                Description: product.Description,
                ISBN10:product.ISBN10,
                image:product.image
            }
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(proObj)
                resolve(products)
        })
    },  
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({_id:-1}).limit(8).toArray()
            resolve(products)
        })
    },
    getAllProductsadmn:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            // db.get().collection(collection.PRODUCT_COLLECTION).updateMany(
            //     {},
            //     { $rename: {"ISBN-10": "ISBN10" } },
            //     false,
            //     true
            //   ).then(()=>{

            // })
            resolve(products)
        })
    }
    ,
    actionAdventure:(id)=>{
        return new Promise (async (resolve,reject)=>{
            let actnAdvnt = await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:ObjectId(id)}).limit(8).toArray()
            // object?.id
            resolve(actnAdvnt)
        })
    }
    ,deleteProduct:(prodId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
                //console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
                resolve(product)
            })
        }) 
    },
    updateProduct:(proId, proDetails)=>{
        return new Promise(async (resolve,reject)=>{

            let prodDtl = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)})
            console.log(" here 1111111111");
            console.log(prodDtl);

             if (proDetails.image.length == 0){
                db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({_id:objectId(proId)},{
                    $set:{
                        ProductName:proDetails.ProductName,
                        Author:proDetails.Author,
                        SellingPrice:parseInt(proDetails.SellingPrice),
                        Category:ObjectId(proDetails.Category),
                        SubCategory:ObjectId(proDetails.SubCategory),
                        Description:proDetails.Description,
                        ISBN10:proDetails.ISBN10,
                        image:prodDtl.image
                    }
                }).then((response)=>{
                    resolve()
                })
             }
             else{
                db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({_id:objectId(proId)},{
                    $set:{
                        ProductName:proDetails.ProductName,
                        Author:proDetails.Author,
                        SellingPrice:parseInt(proDetails.SellingPrice),
                        Category:ObjectId(proDetails.Category),
                        SubCategory:ObjectId(proDetails.SubCategory),
                        Description:proDetails.Description,
                        ISBN10:proDetails.ISBN10,
                        image:proDetails.image
                    }
                }).then((response)=>{
                    resolve()
                })
             }


        })
    },
    getprdbyCat:(catId)=>{
        return new Promise ( (resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find({Category:ObjectId(catId)}).limit(6).toArray().then((response)=>{
                console.log(response);
                resolve(response)
            })

        })

    },
    getprdbyCatName : (catName)=>{
        return new Promise (( resolve, reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find({Category:catName}).toArray().then((response)=>{
                resolve(response)
            })
        })
    },
    getPrdCatcount: (catId) =>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).count({Category:ObjectId(catId)}).then((response)=>{
                console.log("Kamehameha");
                console.log(response);
                resolve(response)
                console.log("Solar Flare");
            })
        })
    },
    getprdbyCategory :(cId,startIndex,limit) =>{
        return new Promise ( (resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find({Category:ObjectId(cId)}).limit(limit).skip(startIndex).toArray().then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    }
}