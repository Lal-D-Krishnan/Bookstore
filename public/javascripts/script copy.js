
function addToCart(proId) {
    console.log('Inside ajax of add to cart');
    console.log(proId);
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.added) {
                //location.reload()
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
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

function onRemoveButton(cartId, proId) {
    // e.preventDefault()
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
            if (response.productRemovedonBtn) {
                alert("Product Removed from cart by Remove Button")
                location.reload()
            } else {
                alert("Something Error has happened")
                location.reload()
            }
        }
    })
}


$(document).ready(function() {


$("#checkout-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU");
            console.log("Inside response of #checkout inside ajax");
            console.log(response);

            if (response.codSuccess) {
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

function ordercancel(orderId) {
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

$(document).ready(function() {
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
                let couponoff = response.offpercent
                console.log(couponoff);
                console.log("response.couponapplied is true \n We can successfully add coupon");
                let total = $('#totalvalue').html()
                let totalvalueaftercoupon = parseInt(total)
                let ddamount = totalvalueaftercoupon * response.offpercent / 100
                totalvalueaftercoupon = Math.ceil(totalvalueaftercoupon - ddamount)
                $('#totalvalue').html(total)
                $("#totalvalueaftercoupon").html(totalvalueaftercoupon)
                $("#couponli").removeAttr("style")
                $("#couponoff").html(couponoff)

                $("#secondli").removeAttr("style")
                let couponsuccessmsg = "&#10004; Coupon Applied Successfully"
                //false message remove
                $('#couponappliedfalse').html("")
                $('#couponstatefalse').html("")
                $('#couponfalse').html("")

                //success message
                $('#couponapplied').html(couponsuccessmsg) // console.log("Coupon Applied Successfully");
                $('#appliedcoupon').css("pointer-events", "none")
                $('#appliedcouponsubmit').css("pointer-events", "none")
                $('#coupondropdown').css("pointer-events", "none")

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
        }
    })
})
});



// $("#wallet-form").submit((e) => {
//     e.preventDefault()
//     console.log("hiiii + inside On");
//     $.ajax({
//         url: '/apply-walletmoney',
//         method: 'post',
//         data: $('#wallet-form').serialize(),
//          success: (response) => {
//             console.log("Now inside response coupon form");
//             if (response) {
               
//                 console.log("Inside response if");
//             }
//         }
//     })
// })


function walletapply(e,userId,walletMny){
    e.preventDefault();
    console.log( "&77777777777" + userId + "&77777777777" + walletMny);
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
                console.log("This is the totalvalue "+ total );

                if(walletMoney > total){
                    let remainingWalletAmt = walletMoney - total
                    let newtotal = 0
                
                    $('#amtdtdfrmwltli').removeAttr("style")
                    $('#amtdtdfrmwlt').html(total)
                
                    $('#amttbpawdli').removeAttr("style")
                    $('#amttbpad').html(newtotal)
                
                    $('#amtliwli').removeAttr("style")
                    $('#amtliw').html(remainingWalletAmt)
                
                
                    // $('input:text[id=wallet1]').val("amounttobepaidbycustomerzero&MOneystillleftinthewallet")
                    $('input:text[id=wallet1]').val("walletcase1")
                
                    $('input:radio[id=payment-method-1]').prop('checked', true); // setting wallet radio as checked
                
                    // NO OTHER PAYMENT METHOD NEEDED AS total is ZERO
                    $('#pm2').css("display","none")
                    $('#pm3').css("display","none")
                    $('#pm4').css("display","none")
                    $('#coupondropdown').css("pointer-events","none")
                }else if(walletMoney < total){
                
                    let newtotal = total - walletMoney
                    let remainingWalletAmt = 0
                
                    $('#amtdtdfrmwltli').removeAttr("style")
                    $('#amtdtdfrmwlt').html(walletMoney)
                
                    $('#amttbpawdli').removeAttr("style")
                    $('#amttbpad').html(newtotal)
                
                    $('#amtliwli').removeAttr("style")
                    $('#amtliw').html(remainingWalletAmt)  
                    
                    // $('input:text[id=wallet1]').val("amountleftwalletzero&amountstilllefttobepaidbypaymentmethod")
                    $('input:text[id=wallet1]').val("walletcase2")
                
                    $('input:radio[id=payment-method-1]').prop('checked', true);
                
                }else if( walletMoney == total ){
                    let newtotal = 0
                    let remainingWalletAmt = 0
                
                    $('#amtdtdfrmwltli').removeAttr("style")
                    $('#amtdtdfrmwlt').html(total)
                
                    $('#amttbpawdli').removeAttr("style")
                    $('#amttbpad').html(newtotal)
                
                    $('#amtliwli').removeAttr("style")
                    $('#amtliw').html(remainingWalletAmt)
                
                    // $('input:text[id=wallet1]').val("amountleftwalletzero&amountstilllefttobepaidZERO&paymentusingwallet")
                    $('input:text[id=wallet1]').val("walletcase3")
                
                    $('input:radio[id=payment-method-1]').prop('checked', true);
                
                
                    // NO OTHER PAYMENT METHOD NEEDED AS total is ZERO
                    $('#pm2').css("display","none")
                    $('#pm3').css("display","none")
                    $('#pm4').css("display","none")
                    $('#coupondropdown').css("pointer-events","none")
                }
            }
        }
    })
}


if(walletMoney > total){
    let remainingWalletAmt = walletMoney - total
    let newtotal = 0

    $('#amtdtdfrmwltli').removeAttr("style")
    $('#amtdtdfrmwlt').html(total)

    $('#amttbpawdli').removeAttr("style")
    $('#amttbpad').html(newtotal)

    $('#amtliwli').removeAttr("style")
    $('#amtliw').html(remainingWalletAmt)


    // $('input:text[id=wallet1]').val("amounttobepaidbycustomerzero&MOneystillleftinthewallet")
    $('input:text[id=wallet1]').val("walletcase1")

    $('input:radio[id=payment-method-1]').prop('checked', true); // setting wallet radio as checked

    // NO OTHER PAYMENT METHOD NEEDED AS total is ZERO
    $('#pm2').css("display","none")
    $('#pm3').css("display","none")
    $('#pm4').css("display","none")
    $('#coupondropdown').css("pointer-events","none")
}else if(walletMoney < total){

    let newtotal = total - walletMoney
    let remainingWalletAmt = 0

    $('#amtdtdfrmwltli').removeAttr("style")
    $('#amtdtdfrmwlt').html(walletMoney)

    $('#amttbpawdli').removeAttr("style")
    $('#amttbpad').html(newtotal)

    $('#amtliwli').removeAttr("style")
    $('#amtliw').html(remainingWalletAmt)  
    
    // $('input:text[id=wallet1]').val("amountleftwalletzero&amountstilllefttobepaidbypaymentmethod")
    $('input:text[id=wallet1]').val("walletcase2")

    $('input:radio[id=payment-method-1]').prop('checked', true);

}else if( walletMoney == total ){
    let newtotal = 0
    let remainingWalletAmt = 0

    $('#amtdtdfrmwltli').removeAttr("style")
    $('#amtdtdfrmwlt').html(total)

    $('#amttbpawdli').removeAttr("style")
    $('#amttbpad').html(newtotal)

    $('#amtliwli').removeAttr("style")
    $('#amtliw').html(remainingWalletAmt)

    // $('input:text[id=wallet1]').val("amountleftwalletzero&amountstilllefttobepaidZERO&paymentusingwallet")
    $('input:text[id=wallet1]').val("walletcase3")

    $('input:radio[id=payment-method-1]').prop('checked', true);


    // NO OTHER PAYMENT METHOD NEEDED AS total is ZERO
    $('#pm2').css("display","none")
    $('#pm3').css("display","none")
    $('#pm4').css("display","none")
    $('#coupondropdown').css("pointer-events","none")

}