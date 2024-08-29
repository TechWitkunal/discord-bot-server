const router = require("express").Router();
const product = require("./product");

// const { isRequestVerify } = require("../middlewares/requestVerify");
// /v1/product/user-product

router.use("/product", product);

module.exports = router;