import * as jsonpointer from "jsonpointer.js";
import * as CLI from "cli.js";
var IRZ = require ('irz_module');
var config = JSON.parse(IRZ.cat("./config.json"));
var prompt = IRZ.getenv("USER") + "@" + IRZ.getenv("HOSTNAME") +"/>";

var state = {
  root: {},
  path: [],
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
  }
};

function execute(cmdargs, path)
{
  if (cmdargs.length == 0)
    return path;

  var location = path[path.length-1].traverse(cmdargs[0]);
  if (location) {
    path.push(location)
    cmdargs.shift();
    return execute(cmdargs,path);
  }
  else
    return undefined;
}

function translate(cmdargs, path)
{
  if (cmdargs.length == 0)
    return path;

  var location = path[path.length-1].traverse(cmdargs[0]);
  if (location) {
    path.push(location)
    cmdargs.shift();
    return translate(cmdargs,path);
  }
  else
    return path;
}

// mandatory function for CLI
function interpret(cmdline)
{
  var cmdargs = cmdline.split(" ");

  var builtins = ["exit", "/", ".."];

  function builtin(command)
  {
    if (command == "exit")
      return null;
    else if (command == "/") {
      state.path = [ state.root ];
    } else if (command == "..") {
      if (state.path.length == 1)
        print("already at the root");
      else {
        state.path.pop();
      }
    }
    return undefined;
  }

  var retval = undefined;

  if (builtins.find((element) => element == cmdargs[0])) {
    retval = builtin(cmdargs[0]);
  } else {
    var newpath = execute(cmdargs, [...state.path]);
    if (newpath)
      state.path = newpath;
  }

  prompt = state.getPrompt();
  return retval;
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
    var completion;
    var cmdargs = userinput.split(" ");
    var newpath = translate([...cmdargs], [...state.path]);
    var complist = newpath[newpath.length-1].list().filter(word => word.startsWith(cmdargs[cmdargs.length-1]));
    var completion = sharedStart(complist);
    if(complist.length > 1)
    {
      print("");
      complist.forEach((element) => print(element));
      return "@" + completion;
    }
    cmdargs.pop();
    cmdargs.push(completion);
    return cmdargs.join(" ");
  }
  else {
    print("");
    state.path[state.path.length-1].list().sort().forEach((element) => print(element));
    return null;
  }
}

print("starting CLI");
print(IRZ.getenv("USER"));

state.root = new CLI.Proto("");
state.root.load(config.schema_path, JSON.parse(IRZ.pipe(config.script_list_path)).list);
//state.root = new Proto("cli", JSON.parse(IRZ.pipe(config.script_list_path)).list, config.schema_path);
state.path.push(state.root);
prompt = state.getPrompt();
