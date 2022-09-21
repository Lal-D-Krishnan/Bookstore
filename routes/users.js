var express = require('express');
const router = express.Router();
const collection = require('../config/colllections')
let cartCount
let wishlistCount = null
const userHelper = require('../helpers/user-helper')
const productHelper = require('../helpers/product-helper');
const categoryHelper = require('../helpers/category-helper');
const walletHelper = require('../helpers/wallet-helper')
const subcategoryHelper = require('../helpers/subcategory-helper');
let User_number
let bannerImage
const { check, validationResult }
  = require('express-validator');
const paypal = require('paypal-rest-sdk');
const { Db } = require('mongodb');
const { json } = require('express');
const { RecordingSettingsContext } = require('twilio/lib/rest/video/v1/recordingSettings');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'Ae6Ap4DXAchKX0YfCvhOtXIZMgCpPxl9ZRF6MFLKO2rSmn1nFlhWBsiy7vOCtz530O73l8HD-hRBljbY',
  'client_secret': 'EJIFhrPfmWlfeuknFXDSyX-lGzItqu_ZqVwF1r3WD-P_Ehe3PJR0YOvN6kqgr-WdZGTb63rDLecVB_Z1'
});

// twilio 
const client = require('twilio')(collection.ACCNT_SID, collection.ACNT_TKN);

const verifyLogin = async (req, res, next) => {
  if (req.session.loggedIn) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishlistCount = await userHelper.getWishlistCount(req.session.user._id)
    next()
  } else {
    //   cartCount = null
    res.render('user/login', { userlogin: true, loginErr: req.session.loginErr })
    req.session.loginErr = false
  }
}

/* GET users listing. */ //middle
router.get('/', async function (req, res, next) {
  let Wproducts
  bannerImage = await userHelper.getBannerImage()
  if (req.session.user) {
    // cartCount = await userHelper.getCartCount(req.session.user._id)
    if (req.session.loggedIn) {

      cartCount = await userHelper.getCartCount(req.session.user._id)
      wishlistCount = await userHelper.getWishlistCount(req.session.user._id)
      let Wproducts = await userHelper.getWishlistproducts(req.session.user._id)
    } else {
      cartCount = null
      wishlistCount = null
    }
  }
  // let getoneCat =await categoryHelper.getonecategory()
  let getactioncategory = await categoryHelper.getACTNADVcatbyName()
  // console.log(getallCat)
  let actnAdvnt = await productHelper.actionAdventure(getactioncategory._id)
  // console.log(actnAdvnt);

  // biography diaries true accounts
  let getBATcategory = await categoryHelper.getBATcatbyName()
  let bioatrue = await productHelper.actionAdventure(getBATcategory._id)

  // crime thriller & mystery
  let getCTMcategory = await categoryHelper.getCTMcatbyName()
  // console.log(getCTMcategory)
  let crimthrilmstry = await productHelper.actionAdventure(getCTMcategory._id)
  // co nsole.log(crimthrilmstry);

  //SCIENCE FICTION & FANTASY
  let getSFFcategory = await categoryHelper.getSFFcatbyName()
  let scificfatsy = await productHelper.actionAdventure(getSFFcategory._id)

  productHelper.getAllProducts().then((products) => {
    res.render('user/view-products', { user: true, products, bioatrue, crimthrilmstry, scificfatsy, actnAdvnt, registeredUser: req.session.user, cartCount, wishlistCount, bannerImage, Wproducts }) //
  })
});

router.get('/signup', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/signup', { userlogin: true })
  }
})

router.post('/signup', (req, res) => {
  Object.assign(req.body, { "active": true })
  userHelper.doSignup(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response
    res.redirect('/')
  })
})
//middle
router.get('/login', verifyLogin, (req, res) => {
  res.redirect('/')
})

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = response.message
      res.redirect('/login')
    }
  })
})




// OTP Login  starts here ------------------------------

router.get('/otplogin', (req, res) => {
  res.render('user/otplogin', { userlogin: true })
})

router.post('/otp-verification', (req, res) => {
  userHelper.NumberExist(req.body.number).then((response) => {
    if (response.userExist == false) {
      res.render("user/otplogin", { UserNotExist: true });
      UserNotExist = false
    } else {
      req.session.loggedIn = true
      req.session.user = response.user;
      const { number } = req.body;
      User_number = number;

      client.verify
        .services(collection.SRV_ID)
        // .services(collection.SERV_ID)
        .verifications.create({
          to: `+91${number}`,
          channel: "sms",
        })
      console.log("otp is sent to the number " + number);
      res.render("user/otp-veri", { userlogin: true });
    }
  })
});



router.post("/otp-matching", function (req, res) {
  const { otp } = req.body;
  client.verify
    .services(collection.SRV_ID)
    // .services(collection.SERV_ID)
    .verificationChecks.create({
      to: `+91${User_number}`,
      channel: "sms",
      code: otp,
    })
    .then((resp) => {
      if (resp.valid == false) {
        req.session.user.otp = true;
        let otpvalidation = req.session.user.otp;
        res.render("user/otp-veri", { otpvalidation })
      } else if (resp.valid == true) {
        console.log("/otp-matching OTP IS VALID");
        console.log("99999999999999999");
        res.redirect("/");
      }
    });
});


// otp login ends here
router.get('/product-details', verifyLogin, (req, res) => {
  res.render('user/product-details', { user: true, registeredUser: req.session.user, cartCount })
})

// user logout
router.get('/logout', (req, res) => {
  cartCount = null
  wishlistCount = null
  req.session.loggedIn = null
  req.session.user = null
  res.redirect('/')
})

//get product details
router.get('/product-details/:id', verifyLogin, async (req, res) => {
  try {
    console.log(req.params.id);
    let id = req.params.id
    console.log(id);
    let product = await productHelper.getProductDetails(id)
    console.log("yuta")
    console.log(product);
    // product.ISBN=product['ISBN-10']
    console.log("yuta")
    // console.log(product)
    // let subcategories = await subcategoryHelper.getallsubcategory()
    let subcate = await subcategoryHelper.getonesubcategory(product.SubCategory)
    let cate = await categoryHelper.getonecategory(product.Category)
    res.render('user/product-details', { product, user: true, cate, registeredUser: req.session.user, cartCount, subcate })
  } catch (error) {
    console.log("Inside try catch error");
    console.log(error);
    res.render('user/errorh', { error: true })
  }
})

router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelper.getCartProducts(req.session.user._id)
  let totalVal = 0
  if (products.length > 0) {
    totalVal = await userHelper.getTotalAmount(req.session.user._id)
    cartCount = await userHelper.getCartCount(req.session.user._id)
    res.render('user/cart', { products, user: true, registeredUser: req.session.user, cartCount, totalVal, wishlistCount })
  } else {
    res.render('user/cartempty', { user: true, registeredUser: req.session.user, wishlistCount })
  }
  console.log(products);
  console.log(req.session.user._id);
})

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  console.log('api call');
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ added: true })
  })
})

router.post('/change-product-quantity', (req, res) => {
  console.log("inside");
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user)
    res.json(response)
    console.log(response);
    // In ajax we don't need to pass the entire html page, we only need to pass the json data 
  })
})

router.post('/remove-from-cart/', (req, res) => {
  console.log(req.body);
  console.log("Inside ----- /remove-from-cart/");
  userHelper.removeIndvPrdt(req.body).then(async (response) => {
    console.log("Inside --post--- /remove-from-cart/");
    console.log(response);
    console.log("Inside -end-post--- /remove-from-cart/");
    res.json(response)
  })
})


//place order page - Checkout
router.get('/place-order', verifyLogin, async (req, res) => {
  let wallettotal = await walletHelper.getWalletTotal(req.session.user._id)
  // wallettotal = wallettotal
  let addresses = await userHelper.getAllAddress(req.session.user._id)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  if (wallettotal.walletTotal == 0) {
    res.render('user/place-order-nowallt', { user: true, registeredUser: req.session.user, cartCount, total, addresses })
  } else {
    res.render('user/place-order', { user: true, registeredUser: req.session.user, cartCount, total, addresses, wallettotal })
  }
})

//wallet ajax
router.post('/apply-walletmoney/:id', (req, res) => {
  console.log("This is the walletmoney amount " + req.params.id);
  walletHelper.getWalletTotal(req.session.user._id).then((response) => {
    console.log("Just before response");
    req.session.user.WT = response.walletTotal
    res.json(response)
  })
})

// coupon ajax
router.post('/apply-coupon', (req, res) => {
  console.log("this is the cpn u just entered " + req.body.appliedcoupon);
  req.session.user.cPn = req.body.appliedcoupon
  userHelper.applyCoupon(req.body).then((response) => {
    res.json(response)
  })
})

let pptotal
let paypalOrderId
router.post('/place-order', async (req, res) => {
  let products = await userHelper.getCartProductList(req.body.userId)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  let cpnapplied = await userHelper.checkifCouponApplied(req.session.user.cPn, req.session.user._id) //PUSHES USERID INTO COUPON USERARRAY
  console.log("Just above here");
  console.log(req.body);
  if (req.body.wallet == 'walletcase1') {
    console.log("Inside wallet case 1");
    let walletMoney = req.session.user.WT
    let remainingWalletAmt = walletMoney - total
    let newtotalw1 = 0

    walletHelper.walletDdut(remainingWalletAmt, req.session.user._id).then(() => {
      userHelper.placeOrder(req.body, products, newtotalw1).then((orderId) => { //Set status:false for order with this order_id and push into wallet collection and decrement wallet total

        walletHelper.walletOrdrpush(orderId, req.session.user._id, total).then(() => {
          paypalOrderId = orderId
          if (req.body['payment-method'] === 'wallet') {
            res.json({ walletSuccess: true })
          }
        })

      })
    })
  } else if (req.body.wallet == 'walletcase2') {
    console.log("Inside wallet case 2");
    let walletMoney = req.session.user.WT
    let newtotalw2 = total - walletMoney
    let remainingWalletAmt = 0

    walletHelper.walletDdut(remainingWalletAmt, req.session.user._id).then(() => {
      userHelper.placeOrder(req.body, products, newtotalw2).then((orderId) => {
        walletHelper.walletOrdrpushCase2(orderId, req.session.user._id, total, walletMoney).then(() => {
          paypalOrderId = orderId
          if (req.body['payment-method'] === 'COD') {
            res.json({ codSuccess: true })
          } else if (req.body['payment-method'] === 'Razorpay') {
            // id of the placed order
            userHelper.generateRazorpay(orderId, newtotalw2).then((response) => {
              response.razorpaySuccess = true
              res.json(response)
            })
          } else if (req.body['payment-method'] === 'Paypal') {
            // call Paypal here
            userHelper.genaratePaypal(orderId, newtotalw2).then((response) => {
              response.paypalsuccess = true
              res.json(response)
            })
          }
        })
      })
    })


  } else if (req.body.wallet == 'walletcase3') {
    console.log("Inside wallet case 3");
    let newtotal = 0
    let remainingWalletAmt = 0
    walletHelper.walletDdut(remainingWalletAmt, req.session.user._id).then(() => {
      userHelper.placeOrder(req.body, products, newtotalw1).then((orderId) => {

        walletHelper.walletOrdrpush(orderId, req.session.user._id, total).then(() => {

          paypalOrderId = orderId
          if (req.body['payment-method'] === 'wallet') {
            res.json({ walletSuccess: true })
          }
        })

      })
    })

  } else if (req.body.couponInp == 'couponisIn') {
    if (cpnapplied) {
      if (cpnapplied.couponapplied == true) { // CASE WHEN COUPON APPLIED
        let deducted = total * (cpnapplied.offpercent / 100)
        let newtotal = Math.ceil(total - deducted)
        pptotal = newtotal
        userHelper.placeOrder(req.body, products, newtotal).then((orderId) => {
          paypalOrderId = orderId
          if (req.body['payment-method'] === 'COD') {
            // if payment-method == cod remove from cart 
            res.json({ codSuccess: true })
          } else if (req.body['payment-method'] === 'Razorpay') { // Razorpay Payment Method
            userHelper.generateRazorpay(orderId, newtotal).then((response) => {
              response.razorpaySuccess = true
              res.json(response)
            })
          } else if (req.body['payment-method'] === 'Paypal') {  // Paypal Payment Method
            userHelper.genaratePaypal(orderId, newtotal).then((response) => {
              response.paypalsuccess = true
              res.json(response)
            })
          }
        })
      }

    }

    // } else if(!req.body.wallet == 'walletcase1' && !req.body.wallet == 'walletcase2' && !req.body.wallet == 'walletcase3' && !req.body.couponInp == 'couponisIn' )
  } else if (req.body.wallet == 'walletcase2+coupon') {
    if (cpnapplied) {
      let walletMoney = req.session.user.WT
      let newtotalw2 = total - parseInt(req.body.amountoffbycpn) - parseInt(req.body.amountoffbywallet)
      let remainingWalletAmt = 0
      pptotal = newtotalw2
      // let remainingWalletAmt = total - parseInt(req.body.amountoffbywallet)
      // let newtotalw2 = remainingWalletAmt - req.body.amountoffbycpn

      console.log("walletcase2+coupon , Inside this case ");


      walletHelper.walletDdut(remainingWalletAmt, req.session.user._id).then(() => {
        userHelper.placeOrder(req.body, products, newtotalw2).then((orderId) => {
          walletHelper.walletOrdrpushCase2(orderId, req.session.user._id, total, walletMoney).then(() => {
            paypalOrderId = orderId
            if (req.body['payment-method'] === 'COD') {
              res.json({ codSuccess: true })
            } else if (req.body['payment-method'] === 'Razorpay') {
              // id of the placed order
              userHelper.generateRazorpay(orderId, newtotalw2).then((response) => {
                response.razorpaySuccess = true
                res.json(response)
              })
            } else if (req.body['payment-method'] === 'Paypal') {
              // call Paypal here
              userHelper.genaratePaypal(orderId, pptotal).then((response) => {
                response.paypalsuccess = true
                res.json(response)
              })
            }
          })
        })
      })


    }
  } else {

    console.log("Did it come here : Normal order transaction ");
    pptotal = total
    userHelper.placeOrder(req.body, products, total).then((orderId) => {
      paypalOrderId = orderId
      if (req.body['payment-method'] === 'COD') {
        res.json({ codSuccess: true })
      } else if (req.body['payment-method'] === 'Razorpay') {
        // id of the placed order
        userHelper.generateRazorpay(orderId, total).then((response) => {
          response.razorpaySuccess = true
          res.json(response)
        })
      } else if (req.body['payment-method'] === 'Paypal') {
        // call Paypal here
        userHelper.genaratePaypal(orderId, total).then((response) => {
          response.paypalsuccess = true
          res.json(response)
        })
      }
    })
  }
})

//paypal success
router.get('/success', async (req, res) => {
  console.log(" Inside /success");
  // console.log(req.body);

  userHelper.changePaymentStatus(paypalOrderId).then(() => {
    const payerId = req.query.PayerID
    const paymentId = req.query.paymentId
    console.log("Inside /success\n");
    console.log(pptotal);
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
        "amount": {
          "currency": "USD",
          "total": "" + pptotal,
        },
      }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
        console.log(error);
        console.log('err');
        throw error
      } else {
        console.log('success');
        console.log(payment);
        res.redirect('/order-success')
      }
    })

  })
})

router.get('/cancel', (req, res) => res.send('Cancelled'));

router.get('/order-success', verifyLogin, (req, res) => {
  res.render('user/order-success', { user: true, registeredUser: req.session.user, cartCount })
})

router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelper.getUserOrders(req.session.user._id)

  console.log("COme here" + orders[0].deliveryDetails);
  res.render('user/orders', { user: true, registeredUser: req.session.user, cartCount, orders })
})

router.get('/view-order-products/:id', verifyLogin, async (req, res) => {
  let products = await userHelper.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { user: true, registeredUser: req.session.user, products })
})

//RAZORPAY change payment status
router.post('/verify-payment', (req, res) => {
  console.log(req.body); // see the format of the output obtained
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("Payment successfull");
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })
})

router.get('/error', (req, res) => {
  res.render('user/error')
})

// user profile
router.get('/profile', async (req, res) => {
  //let profile = await userHelper.getProfile(req.session.user._id)
  let addresses = await userHelper.getAllAddress(req.session.user._id)
  let userdetails = await userHelper.getUserDetails(req.session.user._id)
  let orders = await userHelper.getUserOrders(req.session.user._id)
  console.log("\nIM just up here\n");
  console.log(orders);
  let wtotal = await walletHelper.getWalletTotal(req.session.user._id)
  res.render('user/profile', { user: true, registeredUser: req.session.user, addresses, userdetails, orders, wtotal })
})

router.get('/addaddress', verifyLogin, (req, res) => {
  res.render('user/addaddress', { user: true, registeredUser: req.session.user })

})

// add address
router.post('/addaddress', (req, res) => {
  console.log(req.body);
  userHelper.addAddress(req.body).then(() => {
    res.redirect('/profile')
    console.log("User address added succesfully");
  })
})

router.get('/editaddress/:id', (req, res) => {
  let addressid = req.params.id
  userHelper.getOneAddress(addressid).then((indAddr) => {
    res.render('user/editaddress', { user: true, registeredUser: req.session.user, indAddr })
  })
})

//edit address
router.post('/editaddress/:id', verifyLogin, (req, res) => {
  let indAddr = req.params.id
  userHelper.editoneAddress(indAddr, req.body).then(() => {
    res.redirect('/profile')
  }
  )
})

router.get('/deleteaddress/:id', verifyLogin, (req, res) => {
  let addrId = req.params.id;
  userHelper.deleteOneaddress(addrId).then(() => {
    res.redirect('/profile')
  })
})

//add address from checkout
router.get('/addaddresschkt', verifyLogin, (req, res) => {
  res.render('user/addaddresschkt', { user: true, registeredUser: req.session.user })
})

//post add address from checkout
router.post('/addaddresschkt', (req, res) => {
  console.log(req.body);
  userHelper.addAddress(req.body).then(() => {
    res.redirect('/place-order')
    console.log("From checkout - User address added succesfully");
  })
})

router.get('/view-order-address/:id', verifyLogin, (req, res) => {
  // let deliAddr = req.params.id
  console.log("Part1" + req.params.id);
  userHelper.getOneAddress(req.params.id).then((oneaddr) => {
    console.log("Part2" + oneaddr);
    res.render('user/view-order-address', { user: true, registeredUser: req.session.user, oneaddr })

  })
})

//Edit User //M 
router.get('/edit-user/:id', verifyLogin, async (req, res) => {
  try {

    console.log("Over here here " + req.params.id);
    let userdetails = await userHelper.getUserDetails(req.params.id)
    // let usr = await userHelper.getUserDetails(req.params.id)
    res.render('user/edit-user', { user: true, registeredUser: req.session.user, userdetails })
  } catch (err) {
    console.log("ona ona noisr " + err);
    res.status(404).render('admin/error')
  }
})

router.post('/edit-user/:id', async (req, res) => {
  // let id=req.params.id
  if (req.body.Name == '' || req.body.Email == '') {
    let userdetails = await userHelper.getUserDetails(req.params.id)
    let res_edituser = "Enter Name or Email"
    let editusr = true
    res.render('user/edit-user', { user: true, registeredUser: req.session.user, userdetails, editusr, res_edituser })
    editusr = false
  } else {
    req.session.user = req.body
    userHelper.editUserDetail(req.params.id, req.body).then(() => {
      res.redirect('/profile')
    })
  }
})

//wishlist
router.get('/add-to-wishlist/:id', verifyLogin, async (req, res) => {

  console.log('api call wishlist');
  console.log(req.params.id);
  // console.log('wishlist count' + ', ' + wishlistCount);
  userHelper.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ addedtoWishlist: true })
  })
})

router.get('/wishlist', verifyLogin, async (req, res) => {
  let products = await userHelper.getWishlistproducts(req.session.user._id)
  console.log("Hello here!");
  console.log(products);
  if (products.length > 0) {

    console.log('This is the result of getWishlistproducts');
    console.log(products);
    res.render('user/wishlist', { user: true, registeredUser: req.session.user, products, cartCount, wishlistCount })
  } else {
    res.render('user/wishlistempty', { user: true, registeredUser: req.session.user, cartCount })
  }
})

router.get('/orderreturn/:id', verifyLogin, (req, res) => {
  userHelper.setStatusreturn(req.params.id).then(() => {
    userHelper.getUserOrders(req.session.user._id).then((orders) => {
      res.render('user/orders', { user: true, registeredUser: req.session.user, cartCount, orders })
    })
  })
})

router.get('/ordercancel/:id', verifyLogin, (req, res) => {
  userHelper.setStatuscancel(req.params.id, req.session.user._id).then(() => {
    userHelper.getUserOrders(req.session.user._id).then((orders) => {
      res.json({ success: true })
      // res.render('user/orders',{user:true,registeredUser:req.session.user,cartCount,orders})
    })
  })
})

// router.use(function(req, res, next) {
//   res.status(404).render('user/errorh', {error: true})
//   // next(createError(404));
// });

router.get('/invoice/:id', verifyLogin, async (req, res) => {
  // let id = req.params.id
  console.log("oga oga og aog a");
  // console.log( "this is it" , req.params.id);
  let subtotal = await userHelper.getSubtotal(req.params.id)
  console.log("QQQQ8888888QQQQ" + subtotal);
  userHelper.getBill(req.params.id).then((bill) => {
    // console.log("This is the single bill details", bill);
    res.render('user/invoice', { bill, subtotal })
  })
})

router.get('/shop', verifyLogin, async (req, res) => {
  let cId = req.query.cId;
  console.log(cId);
  let limit = parseInt(req.query.limit);
  console.log(limit);
  let pageno = parseInt(req.query.page);
  console.log(pageno);

  if (req.query?.cId && req.query?.limit && req.query?.page) {

    // console.log("does it go here");
    // let cId = req.query.cId;
    // console.log(cId);
    // let limit = parseInt(req.query.limit);
    // console.log(limit);
    // let pageno = parseInt(req.query.page);
    // console.log(pageno);

    let cateogryid = cId
    let startIndex = pageno * limit
    // let endIndex = pageno
    let allCategories = await categoryHelper.getallcategory()
    let getprodbyCat = await productHelper.getprdbyCategory(cId, startIndex, limit)
    let countofprodbyCat = await productHelper.getPrdCatcount(cId)
    let count = countofprodbyCat

    console.log("DO I get inside here");

    console.log("I'm inside the worst case");

    res.render('user/shop', { user: true, registeredUser: req.session.user, allCategories, getprodbyCat, count, cateogryid })

  } else {

    let allCategories = await categoryHelper.getallcategory()
    // console.log(allCategories[0].Category);
    let catId = await categoryHelper.getCatIdusingName(allCategories[0].Category)
    let getprodbyCat = await productHelper.getprdbyCat(catId._id)
    let countofprodbyCat = await productHelper.getPrdCatcount(catId._id)

    console.log(" no I'm over here");
    let count = countofprodbyCat
    let cateogryid = catId._id;

    res.render('user/shop', { user: true, registeredUser: req.session.user, allCategories, getprodbyCat, count, cateogryid })
  }
})
// router.get('/shop')


router.get('/getproductsbycat/:id', verifyLogin, async (req, res) => {

  let allCategories = await categoryHelper.getallcategory()
  let getprodbyCat = await productHelper.getprdbyCat(req.params.id)
  res.render('user/shop', { user: true, registeredUser: req.session.user, getprodbyCat, allCategories })
})

router.get('/wallethistory/:id', verifyLogin, async (req, res) => {
  let ordersW = await walletHelper.getWalletHistroy(req.params.id)
  // let orderswithwallet = await walletHelper.
  // console.log(ordersWalltMnyUsd);

  res.render('user/wallethistory', { user: true, registeredUser: req.session.user, ordersW })
})

let searchResult
router.post('/searchproduct', async (req, res) => {
  let allCategories = await categoryHelper.getallcategory()

  console.log("Inside /searchproduct");
  console.log(req.body.key);

  userHelper.doSearchinProduct(req.body.key).then((srchRslt) => {
    if (srchRslt.length === 0) {

      res.redirect('/shopsearchnull')
      // res.render('user/shopsearchnull',{ user:true ,registeredUser: req.session.user,allCategories})
    } else {
      searchResult = srchRslt
      res.redirect('/shopsearch')
      // res.render('user/shopsearch',{ user:true ,registeredUser: req.session.user, srchRslt,allCategories})
    }
  })
})

router.get('/shopsearch', verifyLogin, async (req, res) => {
  let allCategories = await categoryHelper.getallcategory()
  console.log(searchResult);
  res.render('user/shopsearch', { user: true, registeredUser: req.session.user, searchResult, allCategories })
})

router.get('/shopsearchnull', verifyLogin, async (req, res) => {
  let allCategories = await categoryHelper.getallcategory()
  res.render('user/shopsearchnull', { user: true, registeredUser: req.session.user, allCategories })
})
module.exports = router;