const mysql = require("mysql");
const inquirer = require("inquirer");

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
  const customer = new BamazonCustomer();
  customer.listItems();
}

function BamazonCustomer() {
  thisCustomer = this;
  thisCustomer.buyItem = function() {
    inquirer
      .prompt([
        {
          message: "Please enter the ID of the item you would like to buy.",
          type: "text",
          name: "ID"
        },
        {
          message: "Please enter the amount you would like to buy",
          type: "number",
          name: "amount"
        }
      ])
      .then(function(response) {
        var userItem = response.ID;
        var userQuantity = response.amount;
        connection.query(
          "SELECT stock_quantity, price FROM products WHERE ?",
          [
            {
              item_id: userItem
            }
          ],
          function(err, res) {
            var leftoverInventory = res[0].stock_quantity - userQuantity;
            var userPrice = res[0].price;
            if (leftoverInventory > 0) {
              connection.query(
                "UPDATE products SET ? WHERE ?",
                [
                  {
                    stock_quantity: leftoverInventory
                  },
                  {
                    item_id: userItem
                  }
                ],
                function(err, res) {
                  let orderTotal = userPrice * userQuantity;
                  console.log(
                    "Your order was completed \n your total is: $" + orderTotal
                  );
                }
              );
            } else {
              console.log("Insufficient quantity!");
              thisCustomer.buyItem();
            }
          }
        );
      });
  };
  thisCustomer.listItems = function() {
    connection.query(
      "SELECT item_id, product_name, price FROM products",
      function(err, result, fields) {
        if (err) throw err;
        console.log("Items for sale:");
        for (let i = 0; i < result.length; i++) {
          let itemID = result[i].item_id;
          let itemName = result[i].product_name;
          let itemPrice = result[i].price;
          console.log(
            "ID: " +
              itemID +
              " || Item: " +
              itemName +
              " || Price: " +
              itemPrice
          );
        }
        thisCustomer.buyItem();
      }
    );
  };
}
