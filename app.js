//jshint esversion:6

var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const ejs = require("ejs");

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'kalyanmoy.borah1',
  database: 'nodelogin'
});

var app = express();
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set('view engine', 'ejs');




app.get('/auth', function(request, response) {
  response.render("login");
});





app.get("/bookings/:id", function(req, res) {
  const id = req.params.id;
  const username = req.session.username;
  connection.query('SELECT * FROM accounts WHERE username = ?', [username], function(error, results, fields) {
    var cus_id = results[0].id;
    let sql1 = `SELECT * FROM flightdata WHERE id=${id}`;
    let query1 = connection.query(sql1, function(err, flight) {
      let bookedFlight = {
        customer_id: cus_id,
        flight_id: id,
				date: flight[0].date,
				serviceProvider: flight[0].serviceProvider,
				from: flight[0].from,
				to: flight[0].to,
				price: flight[0].price,
        confirmation: "waiting"
      };
      let sql2 = "INSERT INTO bookings SET ?";
      let query3 = connection.query(sql2, bookedFlight, function(err, result) {
        if (err) {
          console.log(err);
        } else {
          res.render("bookings", {
            flight: flight,
            username: username
          });
        }
      });
    });
  });

});







app.get("/", function(req, res) {
  res.render("landing");
});

app.get("/confirmation", function(req, res) {
  const username = req.session.username;
  connection.query('SELECT * FROM accounts WHERE username = ?', [username], function(error, results, fields) {
    var cus_id = results[0].id;
    let sql1 = `UPDATE bookings SET confirmation = "Yes" WHERE customer_id=${cus_id}`;
    let query1 = connection.query(sql1, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        res.render("confirmation");
      }
    });

  });

});





app.get('/home', function(request, response) {
  if (request.session.loggedin) {
    let sql = 'SELECT * FROM flightdata';
    let query = connection.query(sql, function(err, flightDatas) {
      if (!err) {
        response.render("home", {
          flightDatas: flightDatas
        });
      }
    });
  } else {
    response.redirect("/auth");
  }
});




app.get('/register', function(request, response) {
  response.render("register");
});

app.get('/flightdata', function(request, response) {
  response.render("flightdata");
});


app.get("/logout", function(req, res) {
  req.session.destroy(function(err) {
    if (!err) {
      res.redirect("/");
    }
  });

});


app.get("/myBookings", function(req, res) {
  const username = req.session.username;
  connection.query('SELECT * FROM accounts WHERE username = ?', [username], function(error, results, fields) {
    var cus_id = results[0].id;
    let sql1 = `SELECT * FROM bookings WHERE customer_id=${cus_id} AND confirmation="Yes"`;
    let query1 = connection.query(sql1, function(err, bookingHistory) {
				if(err){
					console.log(err);
				}else{
					res.render("myBookings",{bookingHistory: bookingHistory})
				}

    });
  });
});


app.post('/auth', function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  if (username && password) {
    connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
      if (results.length > 0) {
        request.session.loggedin = true;
        request.session.username = username;
        response.redirect("/home");
      } else {
        response.render("loginfailure");
      }
      response.end();
    });
  } else {
    response.send('Please enter Username and Password!');
    response.end();
  }
});








app.post("/register", function(req, res) {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  let user = {
    email: email,
    username: username,
    password: password
  };
  let sql = "INSERT INTO accounts SET ?";
  let query = connection.query(sql, user, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      res.render("successreg");
    }
  });
});




app.post("/flightdata", function(req, res) {
  const date = req.body.date;
  const serviceProvider = req.body.serviceProvider;
  const from = req.body.from;
  const to = req.body.to;
  const hour = req.body.h;
  const minute = req.body.m;
  const price = req.body.price;

  let newFlight = {
    date: date,
    serviceProvider: serviceProvider,
    from: from,
    to: to,
    hour: hour,
    minute: minute,
    price: price
  };
  let sql = "INSERT INTO flightdata SET ?";
  let query = connection.query(sql, newFlight, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/home");
    }
  });
});


app.post("/search", function(req, res) {
  const date = req.body.date;
  const myDate = new Date(date);
  const year = myDate.getFullYear();
  const month = myDate.getMonth() + 1;
  const day = myDate.getDate();
  let sql = `SELECT * FROM flightdata WHERE YEAR(Date) =${year} AND MONTH(Date) =${month} AND DAY(DATE)=${day}`;
  let query = connection.query(sql, function(err, flights) {
    if (err) {
      console.log(err);
    } else {
      if (flights.length > 0) {
        res.render("selectedDay", {
          flights: flights
        });
      } else {
        res.render("noFlight");
      }

    }
  });
});




app.post("/filteredbyprice",function(req,res){
	const amount = req.body.amount;
	let sql =`SELECT * FROM flightdata WHERE price <= ${amount}`;
	let query = connection.query(sql, function(err, flights){
		if(err){
			console.log(err);
		}else{
			res.render("filteredbyprice",{flights: flights});
		}
	})
});


app.post("/filteredbyduration",function(req,res){
	const amount = req.body.amount;
	let sql =`SELECT * FROM flightdata WHERE hour <= ${amount}`;
	let query = connection.query(sql, function(err, flights){
		if(err){
			console.log(err);
		}else{
			res.render("filteredbyduration",{flights: flights});
		}
	})
});









app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
