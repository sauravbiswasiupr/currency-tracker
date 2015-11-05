var express = require("express");
var mongoose = require("mongoose");
var Pusher = require("pusher");
var request = require("request");

// import the schemas required
// and other local imports
var helpers = require("./helpers");

var getNewCurrencyValues = helpers.getNewCurrencyValues;
var sanityCheck = helpers.sanityCheck;
var User = require("./models/user").User;
var Currency = require("./models/currency").Currency;


// import the necessary configs
var config = require("./config");
var mongoConfig = config.mongoConfig;
var pusherConfig = config.pusherConfig;
var forexConfig = config.forexConfig;
var FOREX_TOKEN = forexConfig.token;


// Some custom functions
var constructURL = function(baseURL) {
	var url = baseURL + "?_Token=" + FOREX_TOKEN;
	return url;
};

/*
 * Initialize connection to mongodb 
 * and also initialize the Pusher client
 */

mongoose.connect(mongoConfig.url + "/" + mongoConfig.db);

var pusher = new Pusher({
	appId: pusherConfig.appId,
	key: pusherConfig.key,
	secret: pusherConfig.secret,
	encrypted: pusherConfig.encrypted || false,
});

// Initialize app
var app = express();

/*
 * API -->/ 
 * entry point of the application
 */

 app.get("/", function(req, res) {
 	// 1. Populate the collection of currencies in DB with
 	// current value of their exchange rates w.r.t EUR as base
 	// by calling the forex API
    var forex_url = "http://globalcurrencies.xignite.com/xGlobalCurrencies.json/ListActiveCurrencies";
    var url = constructURL(forex_url);

    request.get(url, function(err, resp, body) {
       if (err != null)
       	  throw new Error(err);

       	if (resp.statusCode != 200)
       		throw new Error("Error while calling the forex url");

       	var result = JSON.parse(body);
       	var currencies = [];

       	for (var i = 0; i < result.currencies.length; i++) {
       		currencies.push({
       			name: result.currencies[i].Symbol,
       			currentValue: 0
       		});
       	}

       	Currency.collection.insert(currencies, function(err, result) {
       		if (err)
       			throw err;

       		getNewCurrencyValues();
       		res.json({ success: true });
       	});
    });
 });

/* 
 * API --> /user/currencies
 * Get a list of user currencies based on user Id
 */

app.get("/user/getCurrencies", function(req, res) {
  if (req.param == null)
  	throw new Error("request parameters can't be null or undefined");

  var userId = req.param.id;
  if (userId == null)
  	throw new Error("Need to pass userId in request");

  userId = Integer.parseInt(userId);

  User.find({}, { _id: userId }, function(err, data) {
  	if (err)
  		throw new Error("Error while querying the data: {err=%s}", err);

  	if (data.length == 0)
  		throw new Error("User doesn't exist in DB");

    var results = [];
    var currencies = data[0].currencies;

    for (var i = 0; i < currencies.length; i++) {
       results.push({
       	currName: currencies[i].name,
       	value: currencies[i].value
       });
    }

    res.json({
    	currencies: results
    });
  });
 });
  
  /*
   * API --> /user/putCurrency
   * Given userId, currency name and currency value in
   * request, update the currency list for that user
   */

  app.put("/user/putCurrency", function(req, res) {
  	// Get userId from req.param
  	// Insert into DB for user with Id
  	var userId = sanityCheck(req.params.id);
  	var currName = req.params.currName;

  	User.update({ _id: userId }, {
      $push: {
         currencies: {
         	name: currName
         }
      }
  	}, function(err) {
  		if (err)
  			throw new Error("Error while updating document: {err=%s}", err);

  		res.json({
  			success: true
  		});
  	});
  });

  /*
   * API -> /api/deleteCurrency
   * Given userId and a given currency name in request,
   * delete that particular currency from the array of currencies
   * for that user
   */

  app.delete("/user/deleteCurrency", function(req, res) {
  	// get currency and userId from req.params
  	// Delete that particular key value pair from the currencies array
  	// of that user in DB

  	var userId = sanityCheck(req.params.id);
  	var currName = req.params.currName;

  	User.update({ _id: userId }, {
  	  $pull: {
  	  	currencies: {
  	  	  name: currName
  	  	}
  	  }
  	}, function(err) {
  		if (err)
  			throw new Error("Error while deleting currency in document: {err=%s}", err);

  		res.json({
  			success: true
  		});
  	});
  });

  app.listen(process.env.PORT || 3000, function(err) {
  	console.log("App running");
  });





