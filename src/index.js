import * as jsonpointer from "jsonpointer.js";
import * as CLI from "cli.js";
import * as config from "config.js";

var IRZ = require ('irz_module');

var _USER     = IRZ.getenv("USER")
var _HOSTNAME = IRZ.getenv("HOSTNAME") || "localhost"

var prompt = _USER + "@" + _HOSTNAME;

var state = {
  root: {},
  path: [],
  getPrompt: function(){
    var gen_prompt = _USER + "@" + _HOSTNAME + "\x1b[35m[";
    if (this.path.length == 1) {
      gen_prompt += "/"
    } else {
      this.path.forEach((item, i) => {
      if (item.name)
        gen_prompt += "/" + item.name;
      });
    }
    return gen_prompt + "]\x1b[0m>";
  }
};

function execute(cmdargs, path)
{
  var orig_path = [...path];
  var args = [...cmdargs];
  var command;
  for (command of cmdargs) {
    var result = path[path.length-1];
    // print("exec res: '"+result+"'")
    result = result.traverse(command)
    if (result) {
      args.shift();
      if (result.traversable)
        path.push(result)
      else {
        if (result.execute(args) == true)
        {
          // do partial path reload evaluation
          if (path[path.length-2].traverse(path[path.length-1].name))
          {
            print("section in place");
          }
          else {
            print("section detached");
            orig_path.pop();
            return orig_path;
          }
        }
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
    var result = path[path.length-1].traverse(command);
    if (result) {
      if (result.traversable)
        path.push(result)
      else {
        path.push(result)
        return path;
      }
      // path.push(result);
    }
    else {
      return path;
    }
  }
  return path;
}

// mandatory function for CLI
function interpret(cmdline)
{
  var cmdargs = cmdline.split(" ").filter((e) => {return e && e !== undefined}); // cleanup

  var builtins = ["exit", "/", "..", "list"];

  function builtin(command)
  {
    if (command == "exit")
      return null;

    else if (command == "list") {
      print(state.path[state.path.length-1].list(state.root).map(e => e.name));
    } else if (command == "/") {
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


function sharedStart(array) {
  var A  = array.concat().sort()
  var a1 = A[0]
  var a2 = A[A.length-1]
  var L  = a1.length
  var i  = 0

  while(i < L && a1.charAt(i) === a2.charAt(i))
    i++;

  return a1.substring(0, i);
}

function separator(s, max_len, symb) {
  var sep = "";

  if(!symb)     symb = " "
  if(!max_len)  max_len = 25

  for(var i = 0; i < max_len - s.length; i++)
    sep += symb;
  return sep
}

// tab completion callback
function complete_help(userinput)
{

  if (userinput) {
    var completion;
    var cmdargs = userinput.split(" ");
    var newpath = translate([...cmdargs], [...state.path]);

    var complist = newpath[newpath.length-1].list(state.root).filter(word => word.name.startsWith(cmdargs[cmdargs.length-1]));

    if (complist.length == 0)
      return userinput + " "

    var completion = sharedStart(complist.map(e => e.name));

    if(complist.length > 1)
    {
      print("");
      complist.forEach((element) => {
        if (element.help) {
          print(element.name + separator(element.name) + "\x1b[33m" +element.help+ "\x1b[0m");
        }
        else
          print(element.name)
      });
      cmdargs.pop();
      cmdargs.push(completion);
      // return "@" + cmdargs.join(" ");
      return null
    }
    cmdargs.pop();
    cmdargs.push(completion);
    return cmdargs.join(" ");
  }
  else {
    print("");
    state.path[state.path.length-1].list(state.root).forEach((element) => {
      if (element.help){
        print(element.name + separator(element.name) + "\x1b[33m" +element.help+ "\x1b[0m");
      }
      else
        print(element.name);
    });
    return null;
  }
}

// tab completion callback
function complete(userinput)
{
  if (userinput) {
    var completion;
    var cmdargs = userinput.split(" ");
    var newpath = translate([...cmdargs], [...state.path]);

    var complist = newpath[newpath.length-1].list(state.root).filter(word => word.name.startsWith(cmdargs[cmdargs.length-1]));

    if (complist.length == 0)
      return userinput + " "

    var completion = sharedStart(complist.map(e => e.name));

    if(complist.length > 1)
    {
      print("");
      complist.forEach((element) => print(element.name));
      cmdargs.pop();
      cmdargs.push(completion);
      return "@" + cmdargs.join(" ");
    }
    cmdargs.pop();
    cmdargs.push(completion);
    return cmdargs.join(" ") + " ";
  }
  else {
    print("");
    state.path[state.path.length-1].list(state.root).map(e => e.name).forEach((element) => print(element));
    return null;
  }
}

// print("starting CLI");
print(IRZ.getenv("USER"));

state.root = new CLI.Proto("");
state.root.load(config.schema_path, JSON.parse(IRZ.pipe(config.script_list_path)).list);
//state.root = new Proto("cli", JSON.parse(IRZ.pipe(config.script_list_path)).list, config.schema_path);
state.path.push(state.root);
prompt = state.getPrompt();

IRZ.put("hello");
print("world");
