const fileStorageEngineProduct = multer.diskStorage({
    destination:(req,file,cb)=>{
      // console.log("stage 1");
      cb(null,'./public/product-images')
    },
    filename:(req,file,cb)=>{
      console.log(file);
      cb(null,Date.now()+ '--'+ file.originalname)
    }
  }) 

  const uploadProduct =multer({storage:fileStorageEngineProduct})
  
  router.post('/addproduct',uploadProduct.array('Image',4),function(req, res) {
  
    var filenames = req.files.map(function(file) {
      return file.filename;
    });
    req.body.image = filenames;
    // console.log(req.body);
    productHelper.addProduct(req.body).then(()=>{
      // req.session.proAdd=true
      res.redirect('/admin/addproduct')
    })
    
  });

  
let pptotal
let paypalOrderId
router.post('/place-order',async (req,res)=>{
  console.log("Qqqqqqqqqqqqqqqqqq + this is value after coupon");
  console.log(req.body.totalvalueaftercoupon);
  console.log("Inside the post of sample");
  console.log(req.body);
  let products = await userHelper.getCartProductList(req.body.userId)
  // let totalPrice = await userHelper.getTotalAmount(req.body.userId)
   let totalPrice = req.body.totalvalue
    console.log("Products" + products);
    console.log("Total Price" + totalPrice);
   pptotal=totalPrice
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{
     console.log("response of place order - 1");
    paypalOrderId=orderId
    console.log("response of place order - 2" );
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }else if(req.body['payment-method']==='Razorpay'){
      // id of the placed order
       userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
        //console.log("Response of generate Razorpay",response);
        response.razorpaySuccess=true
          res.json(response)
       })
    }else{
      // call Paypal here
      userHelper.genaratePaypal(orderId,totalPrice).then((response)=>{
       //response.paypalsuccess=true
       console.log("superman2 ___________________");
       console.log(response.id)
       console.log("superman4 ___________________");
        response.paypalsuccess=true
        res.json(response)
      })
    }
  })
})









let pptotal
let paypalOrderId
router.post('/place-order',async (req,res)=>{
  let products = await userHelper.getCartProductList(req.body.userId)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  let cpnapplied = await userHelper.checkifCouponApplied(req.session.user._id)
  if(cpnapplied){

  }


  userHelper.checkifCouponApplied(req.session.user._id).then((response)=>{
    console.log("INside this");
    if(response.couponapplied == true){ // CASE WHEN COUPON APPLIED
      console.log("\n This is the offpercent in the coupon "+ response.cname +" // -" + response.offpercent+" %OFF");
      //do coupon reduction
  let deducted = total * (response.offpercent/100)
  let newtotal =Math.ceil(total -deducted) 
  pptotal = newtotal
  console.log("This is total after deduction in " + newtotal);// THIS IS THE NEW TOTAL AFTER DEDUCTION
  userHelper.placeOrder(req.body,products,newtotal).then((orderId)=>{
    console.log("response of place order - 1");
   paypalOrderId=orderId
   console.log("response of place order - 2" );
   if(req.body['payment-method']==='COD'){
     res.json({codSuccess:true})
   }else if(req.body['payment-method']==='Razorpay'){
     // id of the placed order
      userHelper.generateRazorpay(orderId,newtotal).then((response)=>{
       //console.log("Response of generate Razorpay",response);
       response.razorpaySuccess=true
         res.json(response)
      })
   }else{
     // call Paypal here
     console.log("This is the new total just before generatePaypal" + newtotal);
     userHelper.genaratePaypal(orderId,newtotal).then((response)=>{
      //response.paypalsuccess=true
      console.log("superman2 ___________________");
      console.log(response.id)
      console.log("superman4 ___________________");
       response.paypalsuccess=true
       res.json(response)
     })
   }
 })

      

    

}else{
      // CASE WHEN NO COUPON APPLIED
  // this is the old code 
  console.log("Inside the post of sample");
  console.log(req.body);
  // let products = await userHelper.getCartProductList(req.body.userId)
  // let totalPrice = await userHelper.getTotalAmount(req.body.userId)
  //  let totalPrice = req.body.totalvalue
    console.log("Products" + products);
    console.log("Total Price" + totalPrice);
   pptotal=total
  userHelper.placeOrder(req.body,products,total).then((orderId)=>{
     console.log("response of place order - 1");
    paypalOrderId=orderId
    console.log("response of place order - 2" );
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }else if(req.body['payment-method']==='Razorpay'){
      // id of the placed order
       userHelper.generateRazorpay(orderId,total).then((response)=>{
        //console.log("Response of generate Razorpay",response);
        response.razorpaySuccess=true
          res.json(response)
       })
    }else{
      // call Paypal here
      userHelper.genaratePaypal(orderId,total).then((response)=>{
       //response.paypalsuccess=true
       console.log("superman2 ___________________");
       console.log(response.id)
       console.log("superman4 ___________________");
        response.paypalsuccess=true
        res.json(response)
      })
    }
  })
    } 

  })

})

{{!-- 777777777777777777777777777777 --}}
{{!-- <div class="row">
    <div class="col-12">
        <div class="card m-b-30">
            <div class="card-body">

                <h4 class="mt-0 header-title"> This is the Full report of Orders </h4>
                <p class="text-muted m-b-30 font-14">The Buttons extension for DataTables
                </p>

                <table id="example" class="table table-striped table-bordered" cellspacing="0" width="100%">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        {{!-- <th>Age</th>
                        <th>Start date</th>
                        <th>Salary</th> --}}
                    </tr>
                    </thead>
                    <tbody>
                        {{#each orders}}
                        <tr>
                            <td>{{this.date}}</td>
                            <td>{{this.totalAmount}}</td>
                            <td>{{this.paymentMethod}}</td>
                            {{!-- <td>27</td>
                            <td>2011/01/25</td>
                            <td>$112,000</td> --}}
                        </tr>
                        {{/each}}
                    </tbody>
                </table>

            </div>
        </div>
    </div> <!-- end col -->
</div> <!-- end row --> --}}