var express     = require('express');
var bodyParser  = require('body-parser')
var app         = express();
var sqlite3     = require("sqlite3").verbose();
var fs          = require("fs");
var dbFile      = "db/background-geolocation.db";

// Init db.
var dbh = initDB(dbFile);

app.use(express.static('.'));
app.use(bodyParser.json());
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

/**
* GET /devices
*/
app.get('/devices', function(req, res) {
  console.log('GET /devices', "\n");
  Device.all({}, function(rs) {
    res.send(rs);
  })
});

/**
* GET /locations
*/
app.get('/locations', function(req, res) {
  console.log('GET /locations', JSON.stringify(req.query), "\n");
  Location.all(req.query, function(rs) {
    res.send(rs);
  });
});

/**
* POST /locations
*/
app.post('/locations', function (req, res) {
  console.log('POST /locations', JSON.stringify(req.body), "\n");
  Location.create(req.body);
  res.send('POST /locations');
  //res.status(500).send("Internal Server Error");
  //res.status(404).send("Not Found");

});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('*************************************************************************');
  console.log('* Background Geolocation Server listening at http://%s:%s', host, port);
  console.log('*************************************************************************', "\n");
});

/**
* Device model
*/
var Device = (function() {
  return {
    all: function(conditions, callback) {
      var query = "SELECT device_id, device_model FROM locations GROUP BY device_id, device_model ORDER BY recorded_at DESC";
      var onQuery = function(err, rows) {
        var rs = [];
        rows.forEach(function (row) {
          rs.push(row);
        });
        callback(rs);
      }      
      dbh.all(query, onQuery);
    }
  }
})();
/**
* Location model
*/
var Location = (function() {

  function hydrate(record) {
    if (record.geofence) { record.geofence = JSON.parse(record.geofence); }
    return record;
  }

  return {
    all: function(params, callback) {
      var query = ["SELECT * FROM locations"];
      var conditions = [];
      if (params.start_date && params.end_date) {
        conditions.push("recorded_at BETWEEN ? AND ?")
      }
      if (params.device_id) {
        conditions.push("device_id = ?")
      }
      if (conditions.length) {
        query.push("WHERE " + conditions.join(' AND '));
      }
      query.push("ORDER BY recorded_at DESC");

      console.log(query.join(' '));
      var onQuery = function(err, rows) {
        var rs = [];
        rows.forEach(function (row) {
          rs.push(hydrate(row));
        });
        callback(rs);
      }

      query = query.join(' ');
      if (params.start_date && params.end_date) {
        dbh.all(query, params.start_date, params.end_date, params.device_id, onQuery)
      } else {
        dbh.all(query, onQuery);
      }
    },
    create: function(params) {
      var location  = params.location,
          device    = params.device,
          now       = new Date(),
          query     = "INSERT INTO locations (uuid, device_id, device_model, latitude, longitude, accuracy, altitude, speed, heading, activity_type, activity_confidence, battery_level, battery_is_charging, is_moving, geofence, recorded_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      
      var sth       = dbh.prepare(query);
      
      var insert = function(location) {
        var coords = location.coords,
            battery   = location.battery  || {level: null, is_charging: null},
            activity  = location.activity || {type: null, confidence: null},
            geofence  = (location.geofence) ? JSON.stringify(location.geofence) : null;

        sth.run(location.uuid||'111', device.uuid||'222', device.model, coords.latitude, coords.longitude, coords.accuracy, coords.altitude, coords.speed, coords.heading, activity.type, activity.confidence, battery.level, battery.is_charging, location.is_moving, geofence, location.timestamp, now);
      }
      // Check for batchSync, ie: location: {...} OR location: [...]
      if (typeof(location.length) === 'number') {
        // batchSync: true        
        for (var n=0,len=location.length;n<len;n++) {
          insert(location[n]);          
        }
      } else {        
        // batchSync: false
        insert(location);
      }
      sth.finalize();
    }
  }
})();

/**
* Init / create database
*/
function initDB(filename) {
  if(fs.existsSync(filename)) {
    return new sqlite3.Database(filename);
  } else {
    console.log("Creating DB file.");
    fs.mkdir("db", function(e) {
      fs.openSync(filename, "w");
    });
    
    
    var dbh = new sqlite3.Database(filename);  

    var LOCATIONS_COLUMNS = [
      "id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL", 
      "uuid TEXT",
      "device_id TEXT",
      "device_model TEXT",
      "latitude REAL", 
      "longitude REAL",
      "accuracy INTEGER", 
      "altitude REAL",
      "speed REAL",
      "heading REAL",
      "activity_type TEXT",
      "activity_confidence INTEGER",
      "battery_level REAL",
      "battery_is_charging BOOLEAN",
      "is_moving BOOLEAN",
      "geofence TEXT",
      "recorded_at DATETIME",
      "created_at DATETIME"
    ];
    dbh.serialize(function() {
      dbh.run("CREATE TABLE locations (" + LOCATIONS_COLUMNS.join(',') + ")");
    });
    return dbh;
  }
}
