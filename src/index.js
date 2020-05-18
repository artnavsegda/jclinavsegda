var IRZ = require ('irz_module');
//print("hello");
//IRZ.system("echo system hello");

function interpret(cmdline)
{
  var arguments = cmdline.split(" ");
  print(arguments[0]);
  if (arguments[0] == "exit")
    return null;
}

function complete(userinput)
{
  print("");
  print("Tab !");
  return null;
}