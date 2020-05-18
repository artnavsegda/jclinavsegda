#include <stdio.h>
#include <string.h>
#include <assert.h>
#include <stdlib.h>
#include "jerryscript-config.h"
#include "jerryscript.h"
#include "jerryscript-ext/handler.h"
#include "jerryscript-ext/module.h"
#include "jerryscript-ext/debugger.h"
#include "jerryscript-port.h"
#include "jerryscript-port-default.h"
#include "exception.h"

extern void irz_module_register (void);

static const jerryx_module_resolver_t *resolvers[1] =
{
  &jerryx_module_native_resolver
};

static jerry_value_t handle_require (const jerry_value_t js_function, const jerry_value_t this_val, const jerry_value_t args_p[], const jerry_length_t args_count)
{
  jerry_value_t return_value = 0;
  return_value = jerryx_module_resolve (args_p[0], resolvers, 1);
  return return_value;
}

static void register_js_function (const char *name_p, jerry_external_handler_t handler_p)
{
  jerry_value_t result_val = jerryx_handler_register_global ((const jerry_char_t *) name_p, handler_p);
  if (jerry_value_is_error (result_val))
  {
    jerry_port_log (JERRY_LOG_LEVEL_WARNING, "Warning: failed to register '%s' method.", name_p);
    result_val = jerry_get_value_from_error (result_val, true);
    print_unhandled_exception (result_val);
  }
  jerry_release_value (result_val);
}

jerry_value_t execute(char *buf)
{
  jerry_value_t eval_ret = jerry_parse (NULL, 0, buf, strlen (buf), JERRY_PARSE_NO_OPTS);

  if (!jerry_value_is_error (eval_ret))
  {
    jerry_value_t func_val = eval_ret;
    eval_ret = jerry_run (func_val);
    jerry_release_value (func_val);
  }

  if (jerry_value_is_error (eval_ret))
  {
    eval_ret = jerry_get_value_from_error (eval_ret, true);
    print_unhandled_exception (eval_ret);
  }
  return eval_ret;
}

int main (void)
{
  irz_module_register();
  jerry_init (JERRY_INIT_EMPTY);
  register_js_function("print", jerryx_handler_print);
  register_js_function("require", handle_require);
  jerry_release_value(execute("print('hello')"));
  jerry_cleanup ();
  return 0;
}
