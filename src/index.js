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
  if (userinput) {
    var keys = Object.getOwnPropertyNames(globalstate.schema);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].startsWith(userinput))
        return keys[i];
    }

    var completion;
    Object.getOwnPropertyNames(globalstate.schema).forEach((element) => {completion = element});
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
