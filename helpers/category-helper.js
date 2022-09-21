var db = require('../config/connection')
var collection= require('../config/colllections')
var ObjectId=require('mongodb').ObjectId
const { response } = require('../app')

module.exports= {
        addCategory:(catgry)=>{
        return new Promise(async(resolve,reject)=>{ 
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).insertOne(catgry)
            resolve(category)
        })
        },
        getallcategory:()=>{
            return new Promise(async(resolve,reject)=>{
                let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
                resolve(categories)
            })
        },
        editcategory:(catId,categorydetails)=>{
            return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({_id:ObjectId(catId)},{
                    $set:{
                        Category:categorydetails.Category
                    }
                }).then((response)=>{
                    resolve()
                })
            })
        },
        getonecategory:(catId)=>{
                return new Promise ((resolve,reject)=>{
                    db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:ObjectId(catId)}).then((response)=>{
                        resolve(response)
                    }).catch((err)=>{
                        reject(err)
                    })
                })
            
        },
        deletecategory:(catId)=>{
            return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:ObjectId(catId)}).then((response)=>{
                    resolve(response)
            })
        })
        },
        addOffertoCatgry:(catId,catgryofframt)=>{
            return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({_id:ObjectId(catId)},{
                    $set:{
                        categoryoffer:catgryofframt
                    }
                }).then((response)=>{
                    console.log("This is the response of addOffertoCatgry" + response);
                    resolve(response)
                })
            })
        },
        applyCategoryOffertoProducts: (catId,catofframt)=>{
            //find one product with same category
            return new Promise (async (resolve,reject)=>{
            let products = await  db.get().collection(collection.PRODUCT_COLLECTION).find({Category:ObjectId(catId)}).toArray();
            console.log("Ola I'm Here ------------------");
            console.log(products);

            if(products){ 
                products.map((product)=>{
                    // store OldSellingPrice :
                    let OldSP = parseInt(product.SellingPrice)

                    //set NewSellingprice : 
                    //let categoryOffer = catofframt 
                    let offAmount = Math.ceil(parseInt(product.SellingPrice) * (catofframt/100))
                    let newSellingPrice = Math.ceil(parseInt(product.SellingPrice) - offAmount)

                    db.get().collection(collection.PRODUCT_COLLECTION).updateMany({_id:ObjectId(product._id)},
                    {
                        $set:{
                            OldSellingPrice:OldSP,
                            categoryoffer:catofframt,
                            SellingPrice:newSellingPrice
                        }
                    })
                    console.log("It came here");
                })
            }
            resolve()
        })
        },
        removeOffertoCatgry:(catId)=>{
            return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION)
                .updateOne({_id:ObjectId(catId)},{
                    $unset:{
                        categoryoffer:1
                    }
                }).then((response)=>{
                    console.log("This is the response of removeOffertoCatgry" + response);
                    resolve(response)
                })
            })
        },
        removeCategoryOffertoProducts: (catId)=>{
            //find one product with same category
            return new Promise (async (resolve,reject)=>{
            let products = await  db.get().collection(collection.PRODUCT_COLLECTION).find({Category:ObjectId(catId)}).toArray();
            console.log("Gueneos Mios 'm Here ------------------");
            console.log(products);

            if(products){ 
                products.map((product)=>{
                    // store OldSellingPrice :
                    let SP = parseInt(product.OldSellingPrice)

                    //set NewSellingprice : 
                    //let categoryOffer = catofframt 
                    //let offAmount = Math.ceil(parseInt(product.SellingPrice) * (catofframt/100))
                    //let newSellingPrice = Math.ceil(parseInt(product.SellingPrice) - offAmount)

                    db.get().collection(collection.PRODUCT_COLLECTION).updateMany({_id:ObjectId(product._id)},
                    {
                        $set:{
                            SellingPrice:SP
                        }
                    })
                    db.get().collection(collection.PRODUCT_COLLECTION).updateMany({_id:ObjectId(product._id)},
                    {
                        $unset:{
                            OldSellingPrice:1,
                            categoryoffer:1
                        }
                    })
                    console.log("It came here after unset$");
                })
            }
            resolve()

        })
        },
        getACTNADVcatbyName:()=>{
            return new Promise ((resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:"Action & Adventures"}).then((response)=>{
                    console.log("6666");
                    console.log(response);
                    resolve(response)

                })

            })
        },
        getBATcatbyName:()=>{
            return new Promise ((resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:"Biographies, Diaries & True Account"}).then((response)=>{
                    resolve(response)
                })
            })
        },
        getCTMcatbyName:()=>{
            return new Promise ((resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:"Crime, Thriller & Mystery"}).then((response)=>{
                    resolve(response)
                })
            })
        },
        getSFFcatbyName:()=>{
            return new Promise ((resolve,reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:"Science Fiction & Fantasy"}).then((response)=>{
                    resolve(response)
                })
            })
        },
        getCatIdusingName : (Cname)=>{
            return new Promise ((resolve , reject)=>{
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:Cname}).then((response)=>{
                    console.log("ON top of here");
                    // console.log(response._id);
                    resolve(response)
                })
            })
        }
}
