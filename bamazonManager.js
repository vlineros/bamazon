const inquirer = require("inquirer");
const mysql = require("mysql");

// *** if want to modularize can get rid of connection info and export manager object to another main file that has connection ***

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  afterConnection();
});

function afterConnection() {
  const manager = new BamazonManager();
  manager.showMenu();
}

function BamazonManager() {
  var userManager = this;
  this.showMenu = function() {
    inquirer
      .prompt([
        {
          message: "What would you like to do?",
          type: "list",
          choices: [
            "View Products for Sale",
            "View Low Inventory",
            "Add to Inventory",
            "Add New Product"
          ],
          name: "userChoice"
        }
      ])
      .then(function(response) {
        switch (response.userChoice) {
          case "View Products for Sale":
            userManager.viewProducts();
            break;
          case "View Low Inventory":
            userManager.viewLowInventory();
            break;
          case "Add to Inventory":
            userManager.addInventory();
            break;
          case "Add New Product":
            userManager.addNewProduct();
            break;
        }
      });
  };
  this.viewProducts = function() {
    connection.query(
      "SELECT item_id, product_name, price, stock_quantity FROM products",
      function(err, result, fields) {
        if (err) throw err;
        console.log("Items for sale:");
        for (let i = 0; i < result.length; i++) {
          let itemID = result[i].item_id;
          let itemName = result[i].product_name;
          let itemPrice = result[i].price;
          let itemQuantity = result[i].stock_quantity;
          console.log(
            "ID: " +
              itemID +
              " || Item: " +
              itemName +
              " || Price: " +
              itemPrice +
              " || Stock Left: " +
              itemQuantity
          );
        }
        console.log("");
        userManager.showMenu();
      }
    );
  };
  this.viewLowInventory = function() {
    connection.query(
      "SELECT item_id, product_name, stock_quantity FROM products WHERE stock_quantity < 10",
      function(err, result, fields) {
        if (err) throw err;
        console.log("Items below 10 stock remaining:");
        if (result.length < 1) {
          console.log("There are no items low in stock\n");
        } else {
          for (let i = 0; i < result.length; i++) {
            let itemID = result[i].item_id;
            let itemName = result[i].product_name;
            let itemQuantity = result[i].stock_quantity;
            console.log(
              "ID: " +
                itemID +
                " || Item: " +
                itemName +
                " || Stock Left: " +
                itemQuantity
            );
          }
          console.log("");
        }
        userManager.showMenu();
      }
    );
  };
  this.addInventory = function() {
    inquirer
      .prompt([
        {
          message: "Please enter the ID of the item you would like to restock.",
          type: "text",
          name: "ID"
        },
        {
          message: "Please enter the amount you would like to add",
          type: "number",
          name: "amount"
        }
      ])
      .then(function(response) {
        var userItem = response.ID;
        var userAmount = response.amount;
        connection.query(
          "SELECT stock_quantity FROM products WHERE ?",
          [
            {
              item_id: userItem
            }
          ],
          function(err, res) {
            var startingAmount = res[0].stock_quantity;
            connection.query(
              "UPDATE products SET ? WHERE ?",
              [
                {
                  stock_quantity: startingAmount + userAmount
                },
                {
                  item_id: response.ID
                }
              ],
              function(err, res) {
                console.log("items have been added.");
                userManager.showMenu();
              }
            );
          }
        );
      });
  };
  this.addNewProduct = function() {
    inquirer
      .prompt([
        {
          message: "Enter the name of the product you would like to add",
          type: "text",
          name: "name"
        },
        {
          message:
            "Enter the name of the department you would like to add the product to",
          type: "text",
          name: "department"
        },
        {
          message: "Enter the price of the product you would like to add",
          type: "number",
          name: "price"
        },
        {
          message: "Enter the quantity of the product you would like to add",
          type: "number",
          name: "quantity"
        }
      ])
      .then(function(response) {
        var query =
          "INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES('" +
          response.name +
          "','" +
          response.department +
          "'," +
          response.price +
          "," +
          response.quantity +
          ")";
        console.log(query);
        connection.query(query, function(err, res) {
          if (err) throw err;
          else {
            console.log("item successfully added to store.");
            userManager.showMenu();
          }
        });
      });
  };
}
