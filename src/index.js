var IRZ = require ('irz_module');

var prompt = "cli>";

var globalstate;

// mandatory function for CLI
function interpret(cmdline)
{
  var arguments = cmdline.split(" ");
  print(arguments[0]);
  if (arguments[0] == "exit")
    return null;
}

// tab completion callback
function complete(userinput)
{
  var commands = ["one", "two", "three"];
  if (userinput) {
    for (var i = 0; i < commands.length; i++) {
      if (commands[i].startsWith(userinput))
        return commands[i];
    }
  }
  else {
    print("\nTab !");
    return null;
  }
}

function acquire(commandname)
{
  var state = { schema: {}, data: {} };
  var aulist = JSON.parse(IRZ.pipe(commandname));
  for (var i = 0; i < aulist.length; i++) {
    var somejson = JSON.parse(IRZ.cat(aulist[i]));
    Object.defineProperty(state.schema, somejson.title, {value: somejson});
    if (somejson.acquire === undefined){}
    else {
      var pipedata = IRZ.pipe("./" + somejson.acquire);
      var somejsondata = JSON.parse(pipedata);
      Object.defineProperty(state.data, somejson.title, {value: somejsondata});
    }
  }
  return state;
}

print("starting CLI");
globalstate = acquire("./list.sh");
