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
  var args = [...cmdargs];
  var command;
  for (command of cmdargs) {
    var result = path[path.length-1].traverse(command);
    if (result) {
      args.shift();
      if (result.traversable)
        path.push(result)
      else {
        result.execute(args);
        return undefined;
      }
    }
    else {
      print("command not exist");
      return undefined;
    }
  }
  return path;
}

function translate(cmdargs, path)
{
  var command;
  for (command of cmdargs) {
    if (path[path.length-1].traversable) {
      var result = path[path.length-1].traverse(command);
      if (result)
        path.push(result)
      else
        break;
    }
    else
      break
  }
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
    if (complist.length == 0)
      return userinput + " "
    var completion = sharedStart(complist);
    if(complist.length > 1)
    {
      print("");
      complist.forEach((element) => print(element));
      cmdargs.pop();
      cmdargs.push(completion);
      return "@" + cmdargs.join(" ");
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
