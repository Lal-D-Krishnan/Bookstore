var db = require('../config/connection')
var collection= require('../config/colllections')
var ObjectId=require('mongodb').ObjectId
const { response } = require('../app')

module.exports= {
        getallsubcategory:()=>{
            return new Promise(async(resolve,reject)=>{
                let subcategories = await db.get().collection(collection.SUBCATEGORY_COLLECTION).find().toArray()
                resolve(subcategories)
            })
        },
        editsubcategory:(subcatId,subcategorydetails)=>{
            return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.SUBCATEGORY_COLLECTION)
                .updateOne({_id:ObjectId(subcatId)},{
                    $set:{
                        SubCategory:subcategorydetails.SubCategory
                    }
                }).then((response)=>{
                    resolve()
                })
            })
        },
        getonesubcategory:(subcatId)=>{
            return new Promise (async(resolve,reject)=>{
            db.get().collection(collection.SUBCATEGORY_COLLECTION).findOne({_id:ObjectId(subcatId)}).then((response)=>{
                resolve(response)
            })
        })
        },
        deletesubcategory:(subcatId)=>{
            return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.SUBCATEGORY_COLLECTION).deleteOne({_id:ObjectId(subcatId)}).then((response)=>{
                    resolve(response)
            })
        })
        },
        addsubcategory:(subcatgry)=>{
            return new Promise(async(resolve,reject)=>{ 
                let subcategory = await db.get().collection(collection.SUBCATEGORY_COLLECTION).insertOne(subcatgry)
                resolve(subcategory)
            })
            }
}
