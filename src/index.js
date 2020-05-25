import * as jsonpointer from "jsonpointer.js";

var IRZ = require ('irz_module');

var config = JSON.parse(IRZ.cat("./config.json"));

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

function basename(filename)
{
  var path = filename.split('/');
  var basename = path[path.length-1].split('.')
  return basename[0];
}

class Proto {
  constructor(protoname, filelist, filepath) {
    this.facelist = [];
    this.name = protoname;
    if (filelist)
      this.load(filepath, filelist)
  }
  add(newelement) {
    this.facelist.push(newelement);
  }
  load(filepath, filelist) {
    if (filelist) {
      this.facelist = [];
      filelist.forEach((filename) => {
        var path = filename.split('/');
        var attachproto = this;
        path.forEach((item, i) => {
          if (i > 0) {
            if (i == path.length-1)
              attachproto.load(filepath + filename);
            else {
              var attachmaybe = attachproto.traverse(item);
              if (!attachmaybe)
              {
                attachmaybe = new Proto(item);
                attachproto.facelist.push(attachmaybe);
              }
              attachproto = attachmaybe;
            }
          }
        });
      });
    } else {
      var data = JSON.parse(IRZ.cat(filepath))
      if (data.properties)
        this.facelist.push(new Option(data, basename(filepath)));
      else
        this.facelist.push(new Face(data, basename(filepath)));
    }
  }
  list() {
    var protolist = [];
    this.facelist.forEach((element) => protolist.push(element.name));
    return protolist;
  }
  traverse(command) {
    return this.facelist.find((element) => element.name == command);
  }
}

class Face {
  constructor(schema, name) {
    this.schema = schema;
    this.name = name;
    if (this.schema.acquire) {
      var now_script_path = config.script_path + "/" + this.schema.acquire.exec + " " + this.schema.acquire.args.join(" ");
      //print("piping " + now_script_path);
      var now_data = IRZ.pipe(now_script_path);
      if (now_data)
        this.data = JSON.parse(now_data);
    }
  }
  list() {
    if (this.schema.namesake) {
      var facelist = [];
      Object.getOwnPropertyNames(this.data).forEach((element) => facelist.push(this.data[element][this.schema.namesake]));
      return facelist;
    }
    else
      return Object.getOwnPropertyNames(this.data);
  }
  traverse(command) {
    print("schema: " + JSON.stringify(this.schema));
    print("data: " + JSON.stringify(this.data[command]));
    return undefined;
  }
}

class Option {
  constructor(schema, name) {
    this.schema = schema;
    this.name = name;
    if (this.schema.acquire) {
      var now_script_path = config.script_path + "/" + this.schema.acquire.exec + " " + this.schema.acquire.args.join(" ");
      //print("piping " + now_script_path);
      var now_data = IRZ.pipe(now_script_path);
      if (now_data)
        this.data = JSON.parse(now_data);
    }
  }
  list() {
    return Object.getOwnPropertyNames(this.schema.properties);
  }
  traverse(command) {
    //print("schema: " + JSON.stringify(this.schema.properties[command]));
    //print("data: " + this.data[command]);
    print(this.data[command]);
    return undefined;
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
    state.push(state.location.traverse(cmdargs[0]));
  }
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
    var complist = state.location.list().filter(word => word.startsWith(userinput));
    var completion = sharedStart(complist);
    if(complist.length > 1)
    {
      print("");
      complist.forEach((element) => print(element));
      return "@" + completion;
    }
    return completion;
  }
  else {
    print("");
    state.location.list().sort().forEach((element) => print(element));
    return null;
  }
}

print("starting CLI");

print(IRZ.getenv("USER"));

// var script_list_contents = IRZ.pipe(script_list_path);
// var script_list = JSON.parse(script_list_contents);
// script_list.list.forEach(path => {
//   var this_schema_path = schema_path + path;
//   var this_schema_contents = IRZ.cat(this_schema_path);
//   var this_schema = JSON.parse(this_schema_contents);
// });

state.root = new Proto("cli");
state.root.load(config.schema_path, JSON.parse(IRZ.pipe(config.script_list_path)).list);
//state.root = new Proto("cli", JSON.parse(IRZ.pipe(config.script_list_path)).list, config.schema_path);
state.push(state.root);
prompt = state.getPrompt();
