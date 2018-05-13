var express = require('express');
var router = express.Router();


/* PostgreSQL and PostGIS module and connection setup */
var pg = require("pg"); // require Postgres module

// Setup connection
var username = "postgres" // sandbox username
var password = "" // read only privileges on our table
var host = "localhost"
var database = "Nick_GIS" // database name
var conString = "postgres://"+username+":@"+host+"/"+database; // Your Database Connection

// Set up your database query to display GeoJSON
var coffee_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((subzone09,zone_name,0,0)) As properties FROM subzones_chi2 As lg) As f) As fc";


/* GET home page. */
/* router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
}); */


/* GET Postgres JSON data */
/* router.get('/data', function (req, res) {
    var client = new pg.Client(conString);
    client.connect();
    var query = client.query(coffee_query);
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
        res.send(result.rows[0].row_to_json);
        res.end();
    });
}); */

/* GET the map page */
router.get('/', function(req, res) {
    var selected = [];
	var client = new pg.Client(conString); // Setup our Postgres Client
    client.connect(); // connect to the client
    var query = client.query(coffee_query); // Run our Query
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    // Pass the result to the map page
    query.on("end", function (result) {
        var data = result.rows[0].row_to_json // Save the JSON as variable data
        res.render('map', {
            title: "Express API", // Give a title to our page
            jsonData: data, // Pass data to the View
			dummy:0
        });
    });
});
module.exports = router;

/* GET the filtered page */
router.get('/:filter/:loc', function (req, res) {
    //var selected = [];
    var name = req.query.name;
	var loc = req.query.loc;
    if (name.indexOf("--") > -1 || name.indexOf("'") > -1 || name.indexOf(";") > -1 || name.indexOf("/*") > -1 || name.indexOf("xp_") > -1 || name.length < 1 || loc === undefined){
        console.log("Bad request detected");
        res.redirect('/map');
        return;
    } else {
        console.log("Request passed")
        if (loc==='1'){  
			var filter_query = "SELECT row_to_json(fc) FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(l.geom)::json As geometry, row_to_json((l.subzone,l.cnt,l.quartile,l.filt)) As properties FROM (SELECT rt.geom,rt.subzone,case when lg.cnt <1 then 0 else lg.cnt end as cnt,case when lg.quartile <.25 then 1 when lg.quartile between .25 and .49 then 2 when lg.quartile between .5 and .74 then 3 when lg.quartile > .75 then 4 else 0 end as quartile,case when rt.subzone in (" + name + ") then 1 else 0 end as filt FROM (SELECT a.subzone09,count(*) as cnt,a.geom,percent_rank() over (order by count(*)) as quartile,case when a.subzone09 in (" + name + ") then 1 else 0 end as filt FROM subzones_chi2 As a join (select * from cta_od_zones where origin in (" + name + ")) as dt on a.subzone09=dt.destination group by a.subzone09,a.geom,case when a.subzone09 in (" + name + ") then 1 else 0 end) as lg right join (select geom,subzone09 as subzone from subzones_chi2) as rt on subzone09=rt.subzone order by lg.cnt) as l)As f)As fc";
			var client = new pg.Client(conString);
			client.connect();
			var query = client.query(filter_query);
			query.on("row", function (row, result) {
				result.addRow(row);
			});
			query.on("end", function (result) {
				var data = result.rows[0].row_to_json
				res.render('map', {
					title: "Express API",
					jsonData: data,
					dummy: 1,
					read: "Trips from (blue cells): " + name.length
				});
			});
		}else {
			var filter_query = "SELECT row_to_json(fc) FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(l.geom)::json As geometry, row_to_json((l.subzone,l.cnt,l.quartile,l.filt)) As properties FROM (SELECT rt.geom,rt.subzone,case when lg.cnt <1 then 0 else lg.cnt end as cnt,case when lg.quartile <.25 then 1 when lg.quartile between .25 and .49 then 2 when lg.quartile between .5 and .74 then 3 when lg.quartile > .75 then 4 else 0 end as quartile,case when rt.subzone in (" + name + ") then 1 else 0 end as filt FROM (SELECT a.subzone09,count(*) as cnt,a.geom,percent_rank() over (order by count(*)) as quartile,case when a.subzone09 in (" + name + ") then 1 else 0 end as filt FROM subzones_chi2 As a join (select * from cta_od_zones where destination in (" + name + ")) as dt on a.subzone09=dt.origin group by a.subzone09,a.geom,case when a.subzone09 in (" + name + ") then 1 else 0 end) as lg right join (select geom,subzone09 as subzone from subzones_chi2) as rt on subzone09=rt.subzone order by lg.cnt) as l)As f)As fc";
			
			var client = new pg.Client(conString);
			client.connect();
			var query = client.query(filter_query);
			query.on("row", function (row, result) {
				result.addRow(row);
			});
			query.on("end", function (result) {
				var data = result.rows[0].row_to_json
				res.render('map', {
					title: "Express API",
					jsonData: data,
					dummy: 1,
					read: 'Trips to (blue cells): ' + name.length 
				});
			});
		};
    };
});

/* GET the filtered page
router.get('/:filter/:loc', function (req, res) {
    //var selected = [];
    var name = req.query.name;
	var loc = req.query.loc;
    if (name.indexOf("--") > -1 || name.indexOf("'") > -1 || name.indexOf(";") > -1 || name.indexOf("/*") > -1 || name.indexOf("xp_") > -1 || name.length < 1 || loc === undefined){
        console.log("Bad request detected");
        res.redirect('/map');
        return;
    } else {
        console.log("Request passed")
        var filter_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((id, subzone09,cta_railhm,zone_name)) As properties FROM subzones_chi2 As lg WHERE lg.subzone09 in (" + name + ") and cta_railhm = " + loc + ") As f) As fc";
        var client = new pg.Client(conString);
        client.connect();
        var query = client.query(filter_query);
        query.on("row", function (row, result) {
            result.addRow(row);
        });
        query.on("end", function (result) {
            var data = result.rows[0].row_to_json
            res.render('map', {
                title: "Express API",
                jsonData: data
            });
        });
    };
}); */



