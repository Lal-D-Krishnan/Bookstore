function addToCart(proId) {
    console.log('Inside ajax of add to cart');
    console.log(proId);
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.added) {
                //location.reload()
                //  alert("Product added to cart")
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
                Swal.fire(
                    'Done!',
                    'Product added to cart!',
                    'success'
                )
            }
        }
    })
}

function changeQuantity(cartId, proId, userId, count) {
    event.preventDefault();
    let quantity = parseInt(document.getElementById(proId).innerHTML)
    count = parseInt(count)
    console.log(userId);
    $.ajax({
        url: '/change-product-quantity',
        data: {
            user: userId,
            cart: cartId,
            product: proId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            console.log("hiiii + inside the resposne of /change-product-quantity");
            console.log(response);
            if (response.removeProduct) {
                alert("Product Removed from cart")
                location.reload()
            } else {
                document.getElementById(proId).innerHTML = quantity + count
                document.getElementById('total').innerHTML = response.total
            }
        }
    })
}

function onRemoveButton(e,cartId, proId) {
    e.preventDefault()
    $.ajax({
        url: '/remove-from-cart',
        data: {
            cart: cartId,
            product: proId
        },
        method: 'post',
        success: (response) => {
            console.log("hiiii + inside OnRemovebutn the resposne of /remove-from-cart");
            console.log(response);
            Swal.fire(
                'Removed!',
                'Product removed from cart!',
                'success'
            )
                location.reload()

            // Swal.fire({
            //     title: 'Do you want to Remove Product from Cart?',
            //     showDenyButton: true,
            //     showCancelButton: true,
            //     confirmButtonText: 'Save',
            //     denyButtonText: `Don't save`,
            // }).then((result) => {
            //     /* Read more about isConfirmed, isDenied below */
            //     if (result.isConfirmed) {
            //         Swal.fire("Product Removed from cart by Remove Button")
            //         location.reload()
            //     } else if (result.isDenied) {
            //         Swal.fire("Something Error has happened")
            //         location.reload()
            //     }
            // })
            // if (response.productRemovedonBtn) {
            //     alert("Product Removed from cart by Remove Button")
            //     location.reload()
            // } else {
            //     alert("Something Error has happened")
            //     location.reload()
            // }
        }
    })
}


$(document).ready(function () {
    $("#checkout-form").submit((e) => {
        e.preventDefault()
        $.ajax({
            url: '/place-order',
            method: 'post',
            data: $('#checkout-form').serialize(),
            success: (response) => {
                console.log("Inside response of #checkout inside ajax");
                console.log(response);

                if (response.codSuccess) {
                    location.href = '/order-success'
                } else if (response.walletSuccess) {
                    location.href = '/order-success'
                } else if (response.razorpaySuccess) {
                    razorpayPayment(response)
                } else {
                    console.log("response of paypal " + response.id);
                    for (let i = 0; i < response.links.length; i++) {
                        if (response.links[i].rel === 'approval_url') {
                            location.href = response.links[i].href
                        }
                    }
                }
            }
        })
    })
});


function razorpayPayment(order) {
    var options = {
        "key": "rzp_test_agUUKt0G4SGJAR", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "BookStore B1",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {

            // response - payment nadannathinte response
            // order - create cheytha order, athill annu nammade receipt irikunnath, recipt il aanu nammde orderid irikunnathu
            // nammade db ill indaya order _id
            verifyPayment(response, order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {       // ee data aannu req.body console cheynnathu
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.href = '/order-success'
            } else {
                alert("Payment Failed")
            }
        }
    })
}

function addToWishlist(proId) {
    console.log('Inside ajax of add to Wishlist');
    console.log(proId);
    $.ajax({
        url: '/add-to-wishlist/' + proId,
        method: 'get',
        success: (response) => {
            if (response.addedtoWishlist) {
                //location.reload()
                let wishlistcount = $('#wishlist-count').html()
                wishlistcount = parseInt(wishlistcount) + 1
                $('#wishlist-count').html(wishlistcount)
                // document.getElementById("wbtn").style.backgroundColor = "red";
            }
        }
    })
}

function removeFromWishlist(proId) {
    console.log('Inside ajax of add to Wishlist');
    console.log(proId);
    $.ajax({
        url: '/add-to-wishlist/' + proId,
        method: 'get',
        success: (response) => {
            if (response.addedtoWishlist) {
                location.reload()
                let count = $('#wishlist-count').html()
                count = parseInt(count) - 0
                $('#wishlist-count').html(count)
                // document.getElementById("wbtn").style.removeProperty("background-color");
            }
        }
    })
}

function ordercancel(e,orderId) {
    e.preventDefault()
    $.ajax({
        url: '/ordercancel/' + orderId,
        method: 'get',
        success: (response) => {
            if (response.success) {
                location.reload()
            }
        }
    })
}

function orderreturn(e,orderId) {
    e.preventDefault()
    $.ajax({
        url: '/orderreturn/' + orderId,
        method: 'get',
        success: (response) => {
            if (response.success) {
                location.reload()
            }
        }
    })
}



$(document).ready(function () {
    $("#coupon-form").submit((e) => {
        console.log("Inside coupon form");
        e.preventDefault()
        $.ajax({
            url: '/apply-coupon',
            method: 'post',
            data: $('#coupon-form').serialize(),
            success: (response) => {
                console.log("Now inside reponse coupon form");
                if (response.couponapplied) {
                    console.log(response);

                    if('walletcase2' === $('#wallet').val() ){
                        $('#wallet').val('');
                        console.log("Im inside here weird middle case");
                        //let ke = $('#amttbpad').val()
                        let total = document.getElementById('amttbpad').innerHTML
                        total = parseInt(total)

                        // let coupon = $('#couponoff span').text()
                        let coupon = response.offpercent

                        // let coupon = document.getElementById('couponoff').innerHTML
                        console.log(coupon);
                        coupon = parseInt(coupon)
                        
                        let deducted = total * (coupon/100)
                        deducted = parseInt(deducted)
                        $("#amttbpawdaftwlt2li").removeAttr("style")
                        $('#amttbpawdaftwlt2').text(deducted)

                        total = Math.ceil(total - deducted)
                        //final 
                        $("#secondli").removeAttr("style")

                        $('#totalvalueaftercoupon').text(total)

                        $('input:text[id=amtoffbycpn]').val(deducted)
                        $('input:text[id=wallet]').val("walletcase2+coupon")

                        // $('#appliedcoupon').css("pointer-events", "none")
                        $('#checkout-click1').css("pointer-events", "none")
                        $('#appliedwalletapply').css("pointer-events", "none")
                        // appliedwalletapply


                    }else{
                        let couponoff = response.offpercent
                        console.log(couponoff);
                        console.log("response.couponapplied is true \n We can successfully add coupon");
                        let total = $('#totalvalue').html()
                        let totalvalueaftercoupon = parseInt(total)
                        let ddamount = totalvalueaftercoupon * response.offpercent / 100
                        totalvalueaftercoupon = Math.ceil(totalvalueaftercoupon - ddamount)
                        ddamount = Math.ceil(ddamount)
                        $('#totalvalue').html(total)
                        $("#totalvalueaftercoupon").html(totalvalueaftercoupon)
                        $("#couponli").removeAttr("style")
                        $("#couponoff").html(ddamount)
    
                        $("#secondli").removeAttr("style")
                        let couponsuccessmsg = "&#10004; Coupon Applied Successfully"
                        //false message remove
                        $('#couponappliedfalse').html("")
                        $('#couponstatefalse').html("")
                        $('#couponfalse').html("")
    
                        $('input:text[id=couponbodychecker]').val("couponisIn")  // hidden input type text send with value couponisIn - Signifying coupon is sent
                        $('input:text[id=amtoffbycpn]').val(ddamount)
    
    
                        //success message
                        $('#couponapplied').html(couponsuccessmsg) // console.log("Coupon Applied Successfully");
                        $('#appliedcoupon').css("pointer-events", "none")
                        $('#appliedcouponsubmit').css("pointer-events", "none")
                        $('#coupondropdown').css("pointer-events", "none")
                    }




                } else if (response.couponapplied == false) {


                    let couponalreadyused = "&#10008; Coupon Already Used"
                    $('#couponappliedfalse').html(couponalreadyused)
                    console.log("Coupon Already Used \n response.couponapplied is false");
                } else if (response.couponstate == false) {
                    let couponblocked = "Coupon is Blocked"
                    $('#couponstatefalse').html(couponblocked)
                } else if (response.isCouponcorrect == false) {
                    let couponnosuchcpn = "No such coupon exist"
                    $('#couponfalse').html(couponnosuchcpn)
                } 
                ///////////////////////////////
                // else if( 'walletcase2' == $('#wallet').html()  ){
                //     let total = $('#amttbpad').html()
                //     let coupon = $('#couponoff').html()

                //     let deducted = Math.ceil(total * (coupon/100))
                //     total = total - deducted





                //     //final 
                //     $('#totalvalueaftercoupon').val(total)
                //  }
            }
        })
    })
});

function walletapply(e, userId, walletMny) {
    e.preventDefault();
    console.log("&77777777777" + userId + "&77777777777" + walletMny);
    $.ajax({
        url: '/apply-walletmoney/' + walletMny,
        method: 'post',
        success: (response) => {
            if (response.walletTotal) {
                // location.reload()
                // console.log("Its inside the response.walletTotal" + response.walletTotal);
                let walletMoney = response.walletTotal
                let total = $('#totalvalue').html()
                total = parseInt(total)
                console.log("This is the totalvalue " + total);

                if (walletMoney > total) {
                    console.log("case 1");
                    let remainingWalletAmt = walletMoney - total
                    let newtotal = 0
                    $('#walletmsg').removeAttr('hidden');
                    $('#checkout-click1').css("pointer-events", "none")

                    $('#amtdtdfrmwltli').removeAttr("style")
                    $('#amtdtdfrmwlt').html(total)

                    $('#amttbpawdli').removeAttr("style")
                    $('#amttbpad').html(newtotal)

                    $('#amtliwli').removeAttr("style")
                    $('#amtliw').html(remainingWalletAmt)

                    // $('input:text[id=wallet1]').val("amounttobepaidbycustomerzero&MOneystillleftinthewallet")
                    $('input:text[id=wallet]').val("walletcase1")
                    $('#pm1').removeAttr("style")
                    $('input:text[id=amtoffbywalt]').val(total)


                    $('input:radio[id=payment-method-1]').prop('checked', true); // setting wallet radio as checked

                    // NO OTHER PAYMENT METHOD NEEDED AS total is ZERO
                    $('#pm2').css("display", "none")
                    $('#pm3').css("display", "none")
                    $('#pm4').css("display", "none")
                    $('#coupondropdown').css("pointer-events", "none")
                } else if (walletMoney < total) {
                    console.log("case 2");
                    let newtotal = total - walletMoney
                    let remainingWalletAmt = 0

                    $('#walletmsg').removeAttr('hidden');

                    $('#checkout-click1').css("pointer-events", "none")
                    $('#appliedwalletapply').css("pointer-events", "none")

                    $('#amtdtdfrmwltli').removeAttr("style")
                    $('#amtdtdfrmwlt').html(walletMoney)

                    $('#amttbpawdli').removeAttr("style")
                    $('#amttbpad').html(newtotal)

                    $('#amtliwli').removeAttr("style")
                    $('#amtliw').html(remainingWalletAmt)

                    // $('input:text[id=wallet1]').val("amountleftwalletzero&amountstilllefttobepaidbypaymentmethod")
                    $('input:text[id=wallet]').val("walletcase2")
                    $('input:text[id=amtoffbywalt]').val(walletMoney)

                    // $('input:radio[id=payment-method-1]').css('display', "none");   don't delete this
                    $('#pm1').css("display", "none")
                    // $('input:radio[id=payment-method-1]').prop('checked', true);

                } else if (walletMoney == total) {
                    console.log("case 3");
                    let newtotal = 0
                    let remainingWalletAmt = 0

                    $('#walletmsg').removeAttr('hidden');
                    $('#appliedwalletapply').css("pointer-events", "none")

                    $('#checkout-click1').css("pointer-events", "none")

                    $('#amtdtdfrmwltli').removeAttr("style")
                    $('#amtdtdfrmwlt').html(total)

                    $('#amttbpawdli').removeAttr("style")
                    $('#amttbpad').html(newtotal)

                    $('#amtliwli').removeAttr("style")
                    $('#amtliw').html(remainingWalletAmt)

                    // $('input:text[id=wallet1]').val("amountleftwalletzero&amountstilllefttobepaidZERO&paymentusingwallet")
                    $('input:text[id=wallet]').val("walletcase3")
                    $('#pm1').removeAttr("style")
                    $('input:text[id=amtoffbywalt]').val(total)


                    $('input:radio[id=payment-method-1]').prop('checked', true);

                    // NO OTHER PAYMENT METHOD NEEDED AS total is ZERO
                    $('#pm2').css("display", "none")
                    $('#pm3').css("display", "none")
                    $('#pm4').css("display", "none")
                    $('#coupondropdown').css("pointer-events", "none")
                }

                //////////////
                // else if( 'couponisIn' == $('#couponbodychecker').html() ){
                // else if( (walletMoney < total) && ){
                    

                // }

            }
        }
    })
}


function validateaddress() {
    let address = document.getElementsByName('input-radio').value;

    if (!(address[0].checked || address[1].checked)) {
        alert("Please select a delivery address");
        return false;
    }
}

function validatepaymentmethod() {
    let paymentmthd = document.getElementsByName('input-radio1').value;

    if (!(paymentmthd[0].checked || paymentmthd[1].checked || paymentmthd[2].checked || paymentmthd[3].checked)) {
        alert("Please select a Payment Method");    
        return false;
    }
    return true;
}

    function validateFormcheckout(e) {
        e.preventDefault();
    if (!validateaddress() || !validatepaymentmethod()) {
         alert("Please select address and delivery details"); 
        return false;
    }
    return true;
    
}