var IRZ = require ('irz_module');

var prompt = "cli>"
var globalstate;
var path = [];

// mandatory function for CLI
function interpret(cmdline)
{
  var arguments = cmdline.split(" ");
  if (arguments[0] == "exit")
    return null;

  if (arguments[0] == "/")
  {
    path = [];
    prompt = "cli>";
  }

  if (arguments[0] == "..")
  {
    path.pop();
    prompt = "cli>";
  }

  if (globalstate.schema[arguments[0]])
  {
    print("exist");
    path.push(globalstate.schema[arguments[0]]);
    prompt = "cli/" + arguments[0] + ">";
  }
}

// tab completion callback
function complete(userinput)
{
  if (userinput) {
    var completion;
    Object.getOwnPropertyNames(globalstate.schema).forEach((element) => {
      if (element.startsWith(userinput))
        completion = element;
    });
    return completion;
  }
  else {
    print("");
    Object.getOwnPropertyNames(globalstate.schema).forEach((element) => print(element));
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
