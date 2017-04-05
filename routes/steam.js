var express = require('express');
var request = require('request');
var async = require('async');
var router = express.Router();

router.get('/total-cost', function (req, res, next) {
    var cc = req.query.cc;
    fetchAppIds(cc, function (appids) {
        // var batches = createBatches(appids);
        var result = 0;
        var count = 0;
        async.forEachLimit(appids, 10, function (appid, callback) {
            appDetails(appid, cc, function (cost) {
                result += cost;
                callback();
            });
        }, function (err) {
            res.json(result);
        });
        // batches.forEach(function (batch) {
        //     calculateCost(batch, cc, function (cost) {
        //         result += cost;
        //         count += 1;
        //         if (count == batches.length) {
        //             res.json(result);
        //         }
        //     });
        // }, this);
    });
});

router.get('/app-list', function (req, res, next) {
    request.get({
        url: 'http://api.steampowered.com/ISteamApps/GetAppList/v2/',
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        } else {
            throw error;
        }
    });
});

router.get('/app-info', function (req, res, next) {
    request.get({
        url: 'https://store.steampowered.com/api/appdetails/?cc=' + req.query.cc + '&appids=' + req.query.appids + '&filters=price_overview',
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        } else {
            throw error;
        }
    });
});

router.get('/app-price-history', function (req, res, next) {
    request.get({
        url: 'https://steamdb.info/api/GetPriceHistory/',
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        } else {
            throw error;
        }
    });
});

function calculateCost(batch, cc, callback) {
    request.get({
        url: 'https://store.steampowered.com/api/appdetails/?cc=' + cc + '&appids=' + batch.join(",") + '&filters=price_overview',
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var cost = 0;
            batch.forEach(function (element) {
                cost += ((((body || {})[element] || {})['data'] || {})['price_overview'] || {})['initial'] || 0;
            }, this);
            callback(cost);
        } else {
            throw error;
        }
    });
}

function appDetails(appid, cc, callback) {
    request.get({
        url: 'https://store.steampowered.com/api/appdetails/?cc=' + cc + '&appids=' + appid,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var cost = 0;
            if ((((body || {})[appid] || {})['data'] || {})['type'] == 'game') {
                cost += ((((body || {})[appid] || {})['data'] || {})['price_overview'] || {})['initial'] || 0;
            }
            callback(cost);
        } else {
            callback(0);
        }
    });
}

function createBatches(appids) {
    var batches = [];
    var batchsize = 200;
    for (var index = 0; index < appids.length; index += batchsize) {
        batches.push(appids.slice(index, index + batchsize));
    }
    return batches;
}

function fetchAppIds(cc, callback) {
    var result = [];
    request.get({
        url: 'http://api.steampowered.com/ISteamApps/GetAppList/v2/',
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body['applist']['apps'].forEach(function (app) {
                result.push(app['appid']);
            }, this);
            callback(result);
        } else {
            throw error;
        }
    });
}

module.exports = router;