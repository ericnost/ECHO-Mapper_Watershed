require('dotenv').config()

var express = require("express");

var app =  express();

// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('view cache', false);
app.use('/public/images/', express.static('./public/images'));
app.use(express.static('node_modules'))
var bodyParser=require("body-parser"); 
app.use(bodyParser.urlencoded({
  extended: true
}));

const { Client, Query } = require('pg')
// var conString = "postgres://"+process.env.DB_USER+":"+process.env.DB_PASS+"@"+process.env.DB_HOST+"/"+process.env.DB_TABLE; // Your Database Connection

var conString = "postgres://postgres:**********@localhost:**************";

var zoom = 10
var lat = 42.5
var lng = -89.5
var bounds = [-90,42, -89, 43]


app.get('/', function (req, res) {
	//This is the initial query.
	var db_query = `SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(( HUC12, NAME )) As properties FROM watersheds As lg WHERE lg.geom && ST_MakeEnvelope(-90, 42, -89, 43, 4326)) As f) As fc`;
	//ST_Point_Inside_Circle(lg.geom,"+lat+","+lng+",8000)
    var client = new Client(conString);
    var result=""
    client.connect();
    var query = client.query(new Query(db_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
      var result = result.rows[0].row_to_json;
    	res.render('index', { 
        clat:lat, clng:lng, data:result, zoom: zoom
      });
    });

});

app.post('/watershed', function (req, res) {
    //These are follow-up queries.

    var db_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(( HUC12, NAME )) As properties FROM watersheds As lg WHERE lg.geom && ST_MakeEnvelope("+req.body.minLon+", "+req.body.minLat+", "+req.body.maxLon+", "+req.body.maxLat+", 4326)) As f) As fc";

    var client = new Client(conString);
    var result=""
    client.connect();
    var query = client.query(new Query(db_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
      var result = result.rows[0].row_to_json;
      res.send(result)
    });

});

app.post('/markers', function (req, res) {
    //These are follow-up queries.
    console.log(req.body)
	var db_query = `SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json(( fac_name,cwa_compli,caa_compli,rcra_compl, fac_active)) As properties FROM echo_exporter As lg, (SELECT huc12, name, geom FROM watersheds WHERE watersheds.huc12 = '`+req.body.id+`') As w WHERE (ST_Intersects(lg.geom, w.geom) AND lg.fac_active = 'Y')) As f) As fc`;

	console.log(db_query)
	var client = new Client(conString);
    var result=""
    client.connect();
    var query = client.query(new Query(db_query));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    query.on("end", function (result) {
      console.log(result)
      var result = result.rows[0].row_to_json;
      res.send(result)
    });

});

app.listen(8080);
console.log('8080 is the magic port');