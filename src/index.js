import * as jsonpointer from "jsonpointer.js";

var IRZ = require ('irz_module');

var prompt = "cli>"
var path = [];
var stringpath = "/"

var globalstate;

var state = {
  root: {},
  path: [],
  location: {},
  getLocation: function(){

  },
  getPrompt: function(){
    return this.location.name + ">"
  },
  pop: function() {
    if (this.path.length == 1)
    {
      print("already at root");
      return;
    }
    this.path.pop();
    this.location = this.path[this.path.length-1];
  },
  push: function(element) {
    this.path.push(element);
    this.location = this.path[this.path.length-1];
  }
};

var location;

class Proto {
  constructor(filelist, protoname) {
    this.name = protoname;
    this.filelist = filelist;
    this.load(filelist)
  }
  add(newelement) {
    this.filelist.push(newelement);
  }
  load(filelist) {
    this.facelist = [];
    this.filelist.forEach((filename) => {
      var data = JSON.parse(IRZ.cat(filename))
      if (data.properties)
      {
        this.facelist.push(new Option(data))
      }
      else {
        this.facelist.push(new Face(data))
      }
    });
  }
  list() {
    var protolist = [];
    this.facelist.forEach((element) => protolist.push(element.schema.title));
    return protolist;
  }
  printlist() {
    this.facelist.forEach((element) => print(element.schema.title));
  }
  traverse(command) {
    return this.facelist.find((element) => element.schema.title == command);
  }
}

class Face {
  constructor(schema) {
    this.schema = schema;
    this.name = this.schema.title;
  }
  list() {
    //print(JSON.stringify(this.schema.properties));
    //return this.schema.properties;
    Object.getOwnPropertyNames(this.schema.properties);
  }
  printlist() {
    print("option list");
    print(JSON.stringify(this.schema.properties));
  }
}

class Option {
  constructor(schema) {
    this.schema = schema;
    this.name = this.schema.title;
  }
  list() {
    //print(JSON.stringify(this.schema.properties));
    //return this.schema.properties;
    Object.getOwnPropertyNames(this.schema.properties);
  }
  printlist() {
    print("option list");
    print(JSON.stringify(this.schema.properties));
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
  //prompt = "some>";
  var cmdargs = cmdline.split(" ");
  if (cmdargs[0] == "exit")
    return null;
  else if (cmdargs[0] == "/")
    state.location = state.root;
  else if (cmdargs[0] == "..")
    state.pop();

  if(state.location.traverse(cmdargs[0]))
  {
    print("go " + cmdargs[0]);
    //print(JSON.stringify(state.location.traverse(cmdargs[0])));
    state.push(state.location.traverse(cmdargs[0]));
    //print(JSON.stringify(state.location));
  }
  // if (state.location.schema[cmdargs[0]])
  // {
  //   print("go " + cmdargs[0]);
  //   state.path.push(cmdargs[0]);
  // }
  prompt = state.getPrompt();
}

// tab completion callback
function complete(userinput)
{
  if (userinput) {
    var completion;
    state.location.list().forEach((element) => {
      if (element.startsWith(userinput))
        completion = element;
    });
    return completion;
  }
  else {
    print("");
    //Object.getOwnPropertyNames(globalstate.schema).forEach((element) => print(element));
    state.location.printlist();
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
//var one = new Face(JSON.parse(IRZ.cat("./one.json")));
//var two = new Face(JSON.parse(IRZ.cat("./two.json")));
//var three = new Face(JSON.parse(IRZ.cat("./three.json")));

//one.list();
//two.list();
//three.list();

state.root = new Proto(JSON.parse(IRZ.pipe("./list.sh")),"cli");
state.push(state.root);
prompt = state.getPrompt();

// if (myproto instanceof Proto)
//   print("all good");
