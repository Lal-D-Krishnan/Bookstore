require ("dotenv").config();
accnsid = process.env.ACNT_SID  
accnid = process.env.AUTH_TKN
serviceid = process.env.SERV_ID
module.exports={
    PRODUCT_COLLECTION: 'product',
    USER_COLLECTION: 'user',
    ADMIN_COLLECTION:'admin',
    CATEGORY_COLLECTION:'category',
    SUBCATEGORY_COLLECTION:'subcategory',
    CART_COLLECTION:'cart',
    ORDER_COLLECTION:'order',
    ADDRESS_COLLECTION:'address',
    WISHLIST_COLLECTION:'wishlist',
    COUPON_COLLECTION:'coupon',
    BANNER_COLLECTION:'banner',
    TRANSACTIONS_COLLECTION:'transactions',
    WALLET_COLLECTION:'wallet',
    ACCNT_SID:accnsid,
    ACNT_TKN:accnid,
    SRV_ID : serviceid,
}