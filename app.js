const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const { redirect } = require("statuses");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todoListDB");

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your ToDoList"
});
const item2 = new Item({
  name: "Click + button to add new items"
});
const item3 = new Item({
  name: "<-- press this to delete item"
})

const defaultList = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find().then((item)=>{

    if (item===0) {
      Item.insertMany(defaultList).then((item)=>{
        console.log("Success");
      }).catch((err)=>{
        console.log();
      });
    res.redirect("/");      
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: item});
    }
  }).catch((err)=>{
    console.log(err);
  })  
});

app.get("/:customListName", (req, res)=>{
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}).then((data)=>{
    if (!data) {
      const list = new List({
        name: customListName,
        items: defaultList
      });      

      list.save();
      res.redirect("/" + customListName);
    }
    else{
      res.render("list", {listTitle: data.name, newListItems: data.items})
    }
  }).catch((err)=>{
    console.log(err);
  })
  
})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName}).then((foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }

});

app.post("/delete", function(req, res) {
  const checkedID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedID).then((result)=>{
      console.log(result);
    })
    .catch((err)=>{
      console.log(err);
    })
  
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedID}}}).then((foundlist)=>{
      res.redirect("/"+ listName);
    }).catch((err)=>{
      console.log(err);
    })
  }
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
