import * as jsonpointer from "jsonpointer.js";
import * as CLI from "cli.js";
var IRZ = require ('irz_module');
var config = JSON.parse(IRZ.cat("./config.json"));
var prompt = IRZ.getenv("USER") + "@" + IRZ.getenv("HOSTNAME") +"/>";

var state = {
  root: {},
  path: [],
  location: {},
  getPrompt: function(){
    var gen_prompt = IRZ.getenv("USER") + "@" + IRZ.getenv("HOSTNAME");
    if (this.path.length == 1) {
      gen_prompt += "/"
    } else {
      this.path.forEach((item, i) => {
      if (item.name)
        gen_prompt += "/" + item.name;
      });
    }
    return gen_prompt + ">";
  },
  pop: function() {
    if (this.path.length == 1) {
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

function builtin(command)
{
  if (command == "exit")
    return null;
  else if (command == "/") {
    state.path = [ state.root ];
    state.location = state.root;
  } else if (command == "..")
    state.pop();
  return true;
}

// mandatory function for CLI
function interpret(cmdline)
{
  function execute(cmdarg)
  {
    if(state.location.traverse(cmdarg)){
      print("go " + cmdarg + ">");
      state.push(state.location.traverse(cmdarg));
      return true;
    } else {
      return false;
    }
  }

  var cmdargs = cmdline.split(" ");

  if(!builtin(cmdargs[0]))
    return null;
  else {
    cmdargs.forEach((cmdarg, i) => {
      if (execute(cmdarg) == false) {
        // something
      }
    });
  }
  prompt = state.getPrompt();
}

// tab completion callback
function complete(userinput)
{
  function sharedStart(array){
      var A= array.concat().sort(),
      a1= A[0], a2= A[A.length-1], L= a1.length, i= 0;
      while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
      return a1.substring(0, i);
  }

  if (userinput) {
    // var cmdargs = userinput.split(" ");
    // cmdargs.forEach((cmdarg, i) => {
    //   execute(cmdarg);
    // });

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

state.root = new CLI.Proto("");
state.root.load(config.schema_path, JSON.parse(IRZ.pipe(config.script_list_path)).list);
//state.root = new Proto("cli", JSON.parse(IRZ.pipe(config.script_list_path)).list, config.schema_path);
state.push(state.root);
prompt = state.getPrompt();
