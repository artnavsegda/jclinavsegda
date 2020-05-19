var IRZ = require ('irz_module');

function interpret(cmdline)
{
  var arguments = cmdline.split(" ");
  print(arguments[0]);
  if (arguments[0] == "exit")
    return null;
}

function complete(userinput)
{
  if (userinput) {

  }
  else {
    print("\nTab !");
    return null;
  }
}
