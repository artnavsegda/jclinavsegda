var IRZ = require ('irz_module');

var prompt = "cli>";

function interpret(cmdline)
{
  var arguments = cmdline.split(" ");
  print(arguments[0]);
  if (arguments[0] == "exit")
    return null;
}

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
