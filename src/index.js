var IRZ = require ('irz_module');
//print("hello");
//IRZ.system("echo system hello");

function interpret(cmdline)
{
  print(cmdline);
  var arguments = cmdline.split(" ");
  print(arguments[0]);
}
