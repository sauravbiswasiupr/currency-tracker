"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var currencySchema = new Schema({
	name: String,
	currentValue: Number
});

exports.Currency = mongoose.model("Currency", currencySchema);
