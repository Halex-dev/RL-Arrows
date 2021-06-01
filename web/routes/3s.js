var express = require('express');
var router = express.Router();
const db = require("../../src/lib/db.js");

// another routes also appear here
// this script to fetch data from MySQL databse table
router.get('/leaderbords', function(req, res, next) {
    //const req=request.query;
    var data = db.getLeadNoLimit("rl-3s", "837121322295230474");
    res.render('leaderbords', {userData: data});
});
module.exports = router;