import * as jsonpointer from "jsonpointer.js";

var IRZ = require ('irz_module');

var prompt = IRZ.getenv("USER") + "@" + IRZ.getenv("HOSTNAME") +">";

var state = {
  root: {},
  path: [],
  location: {},
  getLocation: function(){

  },
  getPrompt: function(){
    return IRZ.getenv("USER") + "@" + IRZ.getenv("HOSTNAME") + "/" + this.location.name + ">"
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
    if (this.schema.acquire) {
      this.data = JSON.parse(IRZ.pipe("./" + this.schema.acquire));
    }
  }
  list() {
    //print(JSON.stringify(this.schema.properties));
    //return this.schema.properties;
    //return Object.getOwnPropertyNames(this.schema.properties);
    return Object.getOwnPropertyNames(this.data);
  }
  printlist() {
    print("face list");
    print(Object.getOwnPropertyNames(this.data));
  }
}

class Option {
  constructor(schema) {
    this.schema = schema;
    this.name = this.schema.title;
    if (this.schema.acquire) {
      this.data = JSON.parse(IRZ.pipe("./" + this.schema.acquire));
    }
  }
  list() {
    return Object.getOwnPropertyNames(this.schema.properties);
  }
  printlist() {
    print("option list");
    print(Object.getOwnPropertyNames(this.schema.properties))
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

function sharedStart(array){
    var A= array.concat().sort(),
    a1= A[0], a2= A[A.length-1], L= a1.length, i= 0;
    while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
    return a1.substring(0, i);
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

    print(state.location.list().filter(word => word.startsWith(userinput)));

    // var locode = sharedStart(state.location.list());



    // state.location.list().filter(
    //
    // )

    return completion;
    // sharedStart(state.location.list());
    // print
    // return null;
  }
  else {
    print("");
    //Object.getOwnPropertyNames(globalstate.schema).forEach((element) => print(element));
    state.location.printlist();
    return null;
  }
}

// function acquire(commandname)
// {
//   var state = { schema: {}, data: {} };
//   JSON.parse(IRZ.pipe(commandname)).forEach((element) => {
//     var somejson = JSON.parse(IRZ.cat(element));
//     Object.defineProperty(state.schema, somejson.title, {value: somejson});
//     if (somejson.acquire === undefined){}
//     else {
//       var pipedata = IRZ.pipe("./" + somejson.acquire);
//       var somejsondata = JSON.parse(pipedata);
//       Object.defineProperty(state.data, somejson.title, {value: somejsondata});
//     }
//   });
//   return state;
// }

print("starting CLI");

print(IRZ.getenv("USER"));

state.root = new Proto(JSON.parse(IRZ.pipe("./list.sh")),"cli");
state.push(state.root);
prompt = state.getPrompt();

// if (myproto instanceof Proto)
//   print("all good");
