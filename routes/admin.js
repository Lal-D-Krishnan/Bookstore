const express = require('express');
const router = express.Router();
const adminHelper = require('../helpers/admin-helper');
const productHelper = require('../helpers/product-helper');
const categoryHelper = require('../helpers/category-helper');
const subcategoryHelper = require('../helpers/subcategory-helper');
const transactionHelper = require('../helpers/transactions-helper');
const { render, response } = require('../app');
const multer = require("multer");
const { route } = require('./users');
const { editcategory } = require('../helpers/category-helper');
const { addCategory } = require('../helpers/admin-helper');
const fs = require('fs');
const { COUPON_COLLECTION } = require('../config/colllections');
const { Db } = require('mongodb');
const { log } = require('util');

// - {listOfUsers,adminhome:true,adminhead:true} pass this form admin page to view correctly
//session checking middlewear 
const verifyAdminLogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next()
  } else {
    //adminErr passed when incorrect value is typed
    res.render('admin/admin-login', { admin: true, adminErr: req.session.loginErr })
    req.session.loginErr = false; 
  }
}

/* GET home page. */ // don't delete this very important



router.get('/', verifyAdminLogin, async (req, res) =>{
  let productCount = await adminHelper.productCount()
  let usrCount = await adminHelper.usrCount()
  let ordrCount = await adminHelper.ordrCount()
  let codtotal = await adminHelper.codProfit()
  // console.log("codProfit " + codtotal)
  let razrtotal = await adminHelper.razrProfit()
  // console.log("razrProfit " + razrtotal)
  let ppltotal = await adminHelper.pplProfit()
  // console.log("pplProfit " + ppltotal)yyyyy
  let totalG = codtotal+razrtotal+ppltotal
  //get all orders list

  // very important
//   let mSp = await adminHelper.soldCount() // product and quantity
// function compareCount(a, b) {
//   return a.count - b.count;
// }
// mSp = mSp.sort(compareCount)
// console.log("Over here Here");
// console.log(mSp)
// console.log("Over here Here");
//----------------------------------------------

 let mstSold = await adminHelper.mostSold()
 let lstSold = await adminHelper.leastSold()
  // console.log("I'm over here" + JSON.stringify(mstSold) );
//  console.log("I'm over here" + mstSold.Prodname );
//  console.log("I'm over here" + JSON.stringify(lstSold) );
//  console.log("I'm over here" + lstSold.Prodname );
let getMaxSoldPrdtImg = await adminHelper.mostSoldImg(mstSold)
let getMinSoldPrdtImg = await adminHelper.leastSoldImg(lstSold)
// console.log(getMaxSoldPrdtImg);

// category sold count 
let catySldCnt = await adminHelper.getCatySldcnt()


  res.render("admin/admin-home", { adminhome: true, totalG,ppltotal,razrtotal,codtotal,registeredAdmin: req.session.admin,productCount, catySldCnt ,usrCount,ordrCount, mstSold, getMaxSoldPrdtImg,lstSold,getMinSoldPrdtImg})
});


router.get('/invoiceadmn/:id',verifyAdminLogin,async (req,res)=>{
  let subtotal =await adminHelper.getSubtotalfrmAdm(req.params.id)
  console.log("QQQQ8888888QQQQ" + subtotal);
    adminHelper.getBillfrmAdm(req.params.id).then((bill)=>{
      res.render( 'admin/invoicee' ,{ bill ,subtotal})
    })
})


// admin login
router.post('/admin-login', (req, res) => {
  adminHelper.doAdminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminloggedIn = true
      req.session.admin = response.adminIn
      res.redirect('/admin')
    } else {
      req.session.loginErr = "Invalid Username or Password"
      res.redirect('/admin')
    }
  })
})

//admin logout
router.get('/admin-logout', (req, res) => {
  req.session.adminloggedIn = null
  req.session.admin = null
  res.redirect('/admin')
})

//USER MANAGEMENT
//admin list users // middle
router.get('/listusers', verifyAdminLogin, (req, res) => {
  adminHelper.getAllUsers().then((listOfUsers) => {
    console.log(listOfUsers);
    res.render('admin/listusers', { listOfUsers, adminhome: true })
  })
})


//block user
router.get('/admin-blockuser/:id', verifyAdminLogin, (req, res) => {
  let uid = req.params.id
  adminHelper.blockUser(uid).then((listOfUsers) => {
    req.session.loggedIn = null
    req.session.user = null
    // res.render('admin/listusers',{listOfUsers,adminhome:true,adminhead:true})
    res.redirect('/admin/listusers')
  })
})

//unblock user
router.get('/admin-unblockuser/:id', verifyAdminLogin, (req, res) => {
  let uid = req.params.id
  adminHelper.unblockUser(uid).then((listOfUsers) => {
    // res.render('admin/listusers',{listOfUsers,adminhome:true,adminhead:true})
    res.redirect('/admin/listusers')
  })
})

// MULTER CODE multer add mutiple image - addmultiple image
const fileStorageEngineProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    // console.log("stage 1");
    cb(null, './public/product-images')
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + '--' + file.originalname)
  }
})

const uploadProduct = multer({ storage: fileStorageEngineProduct })
// ------------------------------------------
const fileStorageEngineBanner = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("stage banner");
    cb(null, './public/banner-images')
  },
  filename: (req, file, cb) => {
    console.log("stage banner2");
    console.log(file);
    cb(null, Date.now() + '--' + file.originalname)
  }
  
})

const uploadBanner = multer({ storage: fileStorageEngineBanner })


//PRODUCT MANAGEMENT ---------------------------
//add product
router.get('/addproduct', verifyAdminLogin, async (req, res) => {
  let subcategories = await subcategoryHelper.getallsubcategory()
  categoryHelper.getallcategory().then((categories) => {
    res.render('admin/addproduct', { adminhome: true, categories, subcategories })
  })
})

router.post('/addproduct', uploadProduct.array('Image', 4), function (req, res) {
  var filenames = req.files.map(function (file) {
    return file.filename;
  });
  req.body.image = filenames;
  console.log(req.body);
  productHelper.addProduct(req.body).then(() => {
    // req.session.proAdd=true
    res.redirect('/admin/addproduct')
  })
});

// list products
router.get('/listproducts', verifyAdminLogin, function (req, res, next) {
  productHelper.getAllProductsadmn().then((products) => {
    console.log(products);
    res.render('admin/listproducts', { products, adminhome: true })
  })
});

//edit product
router.get('/editproduct/:id', verifyAdminLogin, async (req, res) => {
   try{ 
    let subcategories = await subcategoryHelper.getallsubcategory()
    let product = await productHelper.getProductDetails(req.params.id)
    let categories = await categoryHelper.getallcategory()
    let cate = await categoryHelper.getonecategory(product.Category)
    let subcate = await subcategoryHelper.getonesubcategory(product.SubCategory)
    res.render('admin/editproduct', { product, adminhome: true, cate, categories, subcategories, subcate })
  } catch (error) {
    res.render('admin/errorh',{error:true})
  }
})

router.post('/editproduct/:id', uploadProduct.array('Image', 4), function (req, res) {
  let pid = req.params.id;
  console.log(pid);
  var filenames = req.files.map(function (file) {
    return file.filename;
  });
  req.body.image = filenames;
  console.log(req.body);
  console.log('here olo')
  productHelper.updateProduct(pid, req.body).then(() => {
    res.redirect('/admin/listproducts')
  })
});

//delete product
router.get('/deleteproduct/:id', verifyAdminLogin, (req, res) => {
  let proId = req.params.id
  productHelper.deleteProduct(proId).then((response) => {
    res.redirect('/admin/listproducts')
  })
})

//CATEGORY MANAGEMENT
//list category
router.get('/listcategory', verifyAdminLogin, (req, res) => {
  categoryHelper.getallcategory().then((categories) => {
    res.render('admin/listcategory', { adminhome: true, categories })
  })
})

// add category get- pinne cheyam verum get
router.get('/addcategory', verifyAdminLogin, (req, res) => {
      try {
    
    res.render('admin/addcategory', { adminhome: true })
  } catch (error) {
    res.render('admin/errorh', {error: true})
  }
})


// add category post- pinne cheyam
router.post('/addcategory', (req, res) => {
  categoryHelper.addCategory(req.body).then((response) => {
    console.log("Category Successfully added");
    res.redirect('/admin/listcategory')
  })
})

//edit category get
// ============================================================================
router.get('/editcategory/:id', verifyAdminLogin,(req, res) => {

    console.log('Hello Hello');
    let catid = req.params.id;
    categoryHelper.getonecategory(catid).then((Indcat)=>{
      res.render('admin/editcategory', { Indcat, adminhome: true })
    }).catch((err) => {
      res.render('admin/errorh', {error: true})
    })
  
   
})

// router.get('/editcategory/:id',verifyAdminLogin, (req, res, next) => {
//   fs.readFile('/editcategory/:id', (err, data) => {
//     if (err) {
//       res.render('/admin/errorh')
//       // next(err) // Pass errors to Express.
//     } else {
//       let catid = req.params.id;
//       categoryHelper.getonecategory(catid, req.body).then((Indcat) => {
//         res.render('admin/editcategory', { Indcat, adminhome: true })
//       })
//       // res.send(data)
//     }
//   })
// })

// =====================================================


//edit category post
router.post('/editcategory/:id', (req, res) => {
  console.log("Get method Edit Category Post Successfully")
  let catid = req.params.id;
  console.log(req.body.name);
  categoryHelper.editcategory(catid, req.body).then((Indcat) => {
    res.redirect('/admin/listcategory')
  })
})

// delete category
router.get('/deletecategory/:id', verifyAdminLogin, (req, res) => {
  let id = req.params.id
  categoryHelper.deletecategory(id).then((response) => {
    res.redirect('/admin/listcategory')
  })
})

//CATEGORY MANAGEMENT
//list subcategory
router.get('/listsubcategory', verifyAdminLogin, (req, res) => {
  subcategoryHelper.getallsubcategory().then((subcategories) => { // subCategoryHelper //create getAllSubCategory function
    res.render('admin/listsubcategory', { adminhome: true, subcategories })
  })
})

// router .get  sub-category
router.get('/addsubcategory', verifyAdminLogin, (req, res) => {
  res.render('admin/addsubcategory', { adminhome: true })
})

// router .post add sub-category
router.post('/addsubcategory', verifyAdminLogin, (req, res) => {
  console.log("Adding one sub category inside post");
  console.log(req.body);
  subcategoryHelper.addsubcategory(req.body).then((response) => {
    console.log("SubCategory Successfully added");
    res.redirect('/admin/addsubcategory')
  })
})

// delete subcategory
router.get('/deletesubcategory/:id', verifyAdminLogin, (req, res) => {
  let id = req.params.id
  subcategoryHelper.deletesubcategory(id).then((response) => {
    res.redirect('/admin/listsubcategory')
  })
})

//edit subcategory get
router.get('/editsubcategory/:id', verifyAdminLogin, (req, res) => {
  let subcatid = req.params.id;
  subcategoryHelper.getonesubcategory(subcatid, req.body).then((Indsubcat) => {
    res.render('admin/editsubcategory', { Indsubcat, adminhome: true })
  })
})

//edit subcategory post
router.post('/editsubcategory/:id', (req, res) => {
  console.log("Get method Edit Category Post Successfully")
  let subcatid = req.params.id;
  console.log(req.body.name);
  subcategoryHelper.editsubcategory(subcatid, req.body).then((Indcat) => {
    res.redirect('/admin/listsubcategory')
  })
})

router.get('/dashboard',verifyAdminLogin,(req,res)=>{
  console.log("Inside /dashboard");
  res.render('admin/dashboard',{adminhome:true})
})

router.get('/admin-listorders/:id',verifyAdminLogin,async (req,res)=>{
  let orders =await adminHelper.getUserOrders(req.params.id)
  req.session.admin.uId = req.params.id
  res.render('admin/admin-listorders',{adminhome:true, orders})
})

router.get('/admin-viewdeliveryaddress/:id',verifyAdminLogin,async (req, res)=>{
  let deliAddr = req.params.id
  adminHelper.getOneAddress(deliAddr).then((oneaddr)=>{
  res.render('admin/admin-viewdeliveryaddress',{adminhome:true,oneaddr})
  })
})

router.get('/admin-vieworderitems/:id',verifyAdminLogin,async (req,res)=>{
  let products = await adminHelper.getOrderProducts(req.params.id)
  res.render('admin/admin-vieworderitems',{adminhome:true,products})
})


// set status - PLACED
router.get('/admin-orderplaced/:id',verifyAdminLogin, (req,res)=>{
  adminHelper.setStatusplaced(req.params.id).then(()=>{
    adminHelper.getUserOrders(req.session.admin.uId).then((orders)=>{
      res.render('admin/admin-listorders',{adminhome:true,orders})
    }) 
  })
})

// set status - PENDING
router.get('/admin-orderpending/:id',verifyAdminLogin,(req,res)=>{
  adminHelper.setStatuspending(req.params.id).then(()=>{
    adminHelper.getUserOrders(req.session.admin.uId).then((orders)=>{
      res.render('admin/admin-listorders',{adminhome:true,orders})
    }) 
  })
})

// set status - SHIPPED
router.get('/admin-ordershipped/:id',verifyAdminLogin,(req,res)=>{
  adminHelper.setStatusshipped(req.params.id).then(()=>{
    adminHelper.getUserOrders(req.session.admin.uId).then((orders)=>{
      res.render('admin/admin-listorders',{adminhome:true,orders})
    }) 
  })
})

// set status - DELIVERED
router.get('/admin-orderdelivered/:id',verifyAdminLogin,(req,res)=>{
  adminHelper.setStatusdelivered(req.params.id).then(()=>{
    adminHelper.getUserOrders(req.session.admin.uId).then((orders)=>{
      res.render('admin/admin-listorders',{adminhome:true,orders})
    }) 
  })
})

// set status - CANCELLED
router.get('/admin-ordercancel/:id',verifyAdminLogin,(req,res)=>{
  adminHelper.setStatuscancel(req.params.id).then(()=>{
    adminHelper.getUserOrders(req.session.admin.uId).then((orders)=>{
      res.render('admin/admin-listorders',{adminhome:true,orders})
    }) 
  })
})

router.get('/listcoupon', verifyAdminLogin,async (req, res)=>{
  let allCoupons = await adminHelper.getAllCoupons()
  res.render('admin/listcoupon',{adminhome:true,allCoupons})
})

// {
//   return new Promise(async(resolve,reject)=>{
//       let subcategories = await db.get().collection(collection.SUBCATEGORY_COLLECTION).find().toArray()
//       resolve(subcategories)
//   })
// }

router.get('/addcoupon', verifyAdminLogin,(req, res)=>{
  res.render('admin/addcoupon',{ adminhome: true})
})

router.get('/blockcoupon/:id',verifyAdminLogin,(req, res)=>{
  adminHelper.blockCoupon(req.params.id).then(()=>{
    res.redirect('/admin/listcoupon')
  })
})
//UNBLOCK COUPON
router.get('/unblockcoupon/:id',verifyAdminLogin,(req, res)=>{
  adminHelper.unblockCoupon(req.params.id).then(()=>{
    res.redirect('/admin/listcoupon')
  })
})
//BLOCK COUPON
router.post('/addcoupon', verifyAdminLogin,(req, res)=>{
  console.log("This is the coupon name " + req.body);
  adminHelper.addcoupon(req.body).then(()=>{
    res.redirect("/admin/listcoupon")
  })
})

// add category offer
router.get('/addcategoryoffer/',verifyAdminLogin,async (req, res)=>{
  let category = await categoryHelper.getonecategory(req.params.id)
  let categories = await categoryHelper.getallcategory()
  res.render('admin/addcategoryoffer', {adminhome:true,category,categories})
  
})

router.post('/addcategoryoffer',async (req, res)=>{
  console.log("This is the /addcategoryoffer");
  console.log(req.body);
  let addCatgryOffer = await categoryHelper.addOffertoCatgry(req.body.category_id,parseInt(req.body.catgryofframt))
  console.log(addCatgryOffer);

categoryHelper.applyCategoryOffertoProducts(req.body.category_id,parseInt(req.body.catgryofframt)).then(()=>{
  console.log("It came here also");
    res.redirect('/admin/addcategoryoffer')
  })  
  // console.log(";ALSKDJF;ALSKJFAL;SKDJFLA;SKDJF;LAKSJFD" + addCatgryOffer );
})

// list category offer
router.get('/listcategoryoffer',verifyAdminLogin, (req, res)=>{
  categoryHelper.getallcategory().then((categories) => {
    res.render('admin/listcategoryoffer', { adminhome: true, categories })

  })
})

// remove category offer 
router.get('/removecategoryoffer/:id',async (req,res)=>{

  let removeCatgryOffer = await categoryHelper.removeOffertoCatgry(req.params.id)

  categoryHelper.removeCategoryOffertoProducts(req.params.id).then(()=>{
    console.log("It came here also");
      res.redirect('/admin/addcategoryoffer')
    })  
})

//BANNER MANAGEMENT

router.get('/addbanner',verifyAdminLogin,(req, res)=>{
  res.render('admin/addbanner',{adminhome:true})
})

router.post('/addbanner', uploadBanner.array('image'), function (req, res) {
  console.log("33333333333333333333");
  console.log("YYYYYYYYYYYY " + req.files);
  
  var filenames = req.files.map(function (files) {
    return files.filename;
  });
  let filename =[]
  filename[0]=req.files[0].filename
  filename[1]=req.files[1].filename

  // req.body.image = filenames;
  adminHelper.addBanners(filename).then(() => {
    res.redirect('/admin/addbanner')
  })
});

router.get('/transactionhistory' ,verifyAdminLogin,(req,res)=>{

  transactionHelper.getTransactiondetails().then((orders)=>{
    res.render('admin/transactionhistory',{adminhome:true, orders})
  })
})

router.get('/orderslist',verifyAdminLogin,async (req,res)=>{
  let orders = await adminHelper.getallOrders()
  res.render('admin/orderslist',{adminhome:true,orders})
})

router.post('/daterange',verifyAdminLogin, (req,res)=>{
  console.log("/daterangem " + JSON.stringify(req.body));
  console.log("/daterangem " + req.body.startdate);
  console.log("/daterangem " + req.body.enddate);
let startdate = new Date(req.body.startdate)
let enddate = new Date(req.body.enddate)
console.log("This Startdate  "+ startdate);
console.log("This Enddate  "+ enddate);

adminHelper.getallOrdersrange(startdate, enddate).then((orders)=>{
  req.session.admin.orderss = orders
  res.redirect('/admin/orderslistcustom')
})
})

router.get('/orderslistcustom', verifyAdminLogin,(req, res)=>{
  orders = req.session.admin.orderss
  res.render('admin/orderslist',{adminhome:true,orders})
})

//get all orders on a range 

module.exports = router;
