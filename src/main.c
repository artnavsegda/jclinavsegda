#include "jerryscript-config.h"
#include "jerryscript.h"
#include "jerryscript-ext/handler.h"
#include "jerryscript-ext/module.h"
#include "jerryscript-ext/debugger.h"
#include "jerryscript-port.h"
#include "jerryscript-port-default.h"

int main (void)
{
  jerry_init (JERRY_INIT_EMPTY);
  register_js_function("print", jerryx_handler_print);
