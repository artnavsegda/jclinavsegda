var IRZ = require ('irz_module');

var prompt = "cli>"
var globalstate;
var path = [];

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
  var arguments = cmdline.split(" ");
  if (arguments[0] == "exit")
    return null;

  if (arguments[0] == "/")
  {
    path = [];
  }

  if (arguments[0] == "..")
  {
    path.pop();
  }

  if (globalstate.schema[arguments[0]])
  {
    print("exist");
    path.push(arguments[0]);
  }
  prompt = generateprompt(path);
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
