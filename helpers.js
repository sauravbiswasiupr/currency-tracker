"use strict";

var async = require("async");
var Currency = require("./models/currency").Currency;
var request = require("request");

var getNewCurrencyValues = function(FOREX_TOKEN, pusher) {
	setInterval(function() {
		// call the forex API to get new values
		Currency.find({}, {}, function(err, data) {
          if (err)
          	throw err;

          if (data.length == 0)
          	throw new Error("No data found");

          async.each(data, function(currency, next) {
          	// for each data make a call to the forex api and see
          	// if the conversion rate returned is greater than curren value in the DB
          	// for that currency. If greater save it to the DB
          	var baseurl = "http://globalcurrencies.xignite.com/xGlobalCurrencies.json/" + 
          	          "GetRealTimeRate?Symbol=EUR" + currency.name; + "&_Token=" + 
          	          FOREX_TOKEN;

          	request.get(baseurl, function(err, resp, body) {
          		if (err || resp.statusCode != 200)
          			throw new Error("Error while calling the FOREX API");

                var result = JSON.parse(result);
                var valNow = result.Bid || result.Mid || result.Ask;

                if (valNow > currency.currentValue) {
                	Currency.update({name: currency.name}, {
                		$set: {
                			currentValue: valNow
                		}
                	}, function(err, result) {
                		// find the userids for whom this particular currency changed and 
                		// store them somewhere, to push notifications later
                		pusher.trigger(
                			currency.name, 
                			"currency_update", 
                			{ message:  "The currency quote for" + currency.name + " has been updated" }
                		);
                		next(null);
                	});
                } else {
                	next(null);
                }
          	});
          }, function(err) {
          	if (err)
          		throw err;
          });
		});
	}, 1000 * 60 * 60);
};
exports.getNewCurrencyValues = getNewCurrencyValues;

var sanityCheck = function(id) {
	if (id == null)
		throw new Error("id can't be null or undefined");

	var userId = Integer.parseInt(id);
	return userId;
};
exports.sanityCheck = sanityCheck;
