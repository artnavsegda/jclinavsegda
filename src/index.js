import * as jsonpointer from "jsonpointer.js";

var IRZ = require ('irz_module');

var prompt = "cli>"
var path = [];
var stringpath = "/"

var globalstate;

var state = {
  path: [],
  location: {},
  getLocation: function(){

  },
  getPath: function(){

  },
  pop: function() {
  },
  push: function(element) {

  }
};

var location;

class Proto {
  constructor(filelist) {
    this.filelist = filelist;
    this.load(filelist)
  }
  add(newelement) {
    this.filelist.push(newelement);
  }
  load(filelist) {
    this.facelist = [];
    this.filelist.forEach((filename) => {
      this.facelist.push(new Face(JSON.parse(IRZ.cat(filename))));
    });
  }
  list() {
    var protolist = [];
    this.facelist.forEach((element) => {
     protolist.push(element.schema.title);
    });
    return protolist;
  }
  printlist() {
    this.facelist.forEach((element) => {
     print(element.schema.title);
    });
  }
}

class Face {
  constructor(schema) {
    this.schema = schema;
  }
  list() {
    print(JSON.stringify(this.schema.properties));
    return this.schema.properties;
  }
}

function generateprompt(stack_path)
{
  if (stack_path[0]){
    return "cli/" + stack_path[0] + ">";
  }
  else {
    return "cli>";
  }
}

// mandatory function for CLI
function interpret(cmdline)
{
  var cmdargs = cmdline.split(" ");
  if (cmdargs[0] == "exit")
    return null;

  if (cmdargs[0] == "/")
  {
    location = root;
  }

  if (cmdargs[0] == "..")
  {
    path.pop();
  }

  if (globalstate.schema[cmdargs[0]])
  {
    print("exist");
    path.push(cmdargs[0]);
  }
  prompt = generateprompt(path);
}

// tab completion callback
function complete(userinput)
{
  if (userinput) {
    var completion;
    location.list().forEach((element) => {
      if (element.startsWith(userinput))
        completion = element;
    });
    return completion;
  }
  else {
    print("");
    //Object.getOwnPropertyNames(globalstate.schema).forEach((element) => print(element));
    location.printlist();
    return null;
  }
}

function acquire(commandname)
{
  var state = { schema: {}, data: {} };
  JSON.parse(IRZ.pipe(commandname)).forEach((element) => {
    var somejson = JSON.parse(IRZ.cat(element));
    Object.defineProperty(state.schema, somejson.title, {value: somejson});
    if (somejson.acquire === undefined){}
    else {
      var pipedata = IRZ.pipe("./" + somejson.acquire);
      var somejsondata = JSON.parse(pipedata);
      Object.defineProperty(state.data, somejson.title, {value: somejsondata});
    }
  });
  return state;
}

print("starting CLI");
globalstate = acquire("./list.sh");

//print(JSON.stringify(jsonpointer.get(globalstate.data, "/one")));

// var myproto = new Proto(["one", "two", "three"]);
// myproto.add(new Proto("test"));
// myproto.add(new Face("test"));
// myproto.list();
//
// JSON.parse(IRZ.pipe("./list.sh")).forEach((element) => {
//   print(JSON.parse(IRZ.cat(element)));
// });


//var myface = new Face("./one.json");
var one = new Face(JSON.parse(IRZ.cat("./one.json")));
var two = new Face(JSON.parse(IRZ.cat("./two.json")));
var three = new Face(JSON.parse(IRZ.cat("./three.json")));

//one.list();
//two.list();
//three.list();

var root = new Proto(JSON.parse(IRZ.pipe("./list.sh")));

print(root.list());

location = root;

// if (myproto instanceof Proto)
//   print("all good");
