#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <linux/limits.h>
#include <dirent.h>
#include <assert.h>
#include <readline/readline.h>
#include <readline/history.h>
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

static jerry_value_t execute(char *buf)
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

static char * loadfile(char *filename)
{
  int jsmain = open(filename,O_RDONLY);

  if (jsmain == -1)
  {
    return NULL;
  }

  struct stat sb;
  fstat(jsmain, &sb);
  char *buf = malloc(sb.st_size+2);
  read(jsmain,buf,sb.st_size+1);
  close(jsmain);
  buf[sb.st_size] = '\0';
  return buf;
}

static jerry_value_t call_single_str(jerry_value_t function, char * argument)
{
  jerry_value_t args[1];
  args[0] = jerry_create_string_from_utf8 (argument);
  jerry_value_t this_val = jerry_create_undefined();
  jerry_value_t ret_val = jerry_call_function(function, this_val, args, 1);
  jerry_release_value(this_val);
  jerry_release_value(args[0]);
  return ret_val;
}

static char * allocate_string(jerry_value_t string_val)
{
  jerry_size_t string_size = jerry_get_string_size (string_val);
  jerry_char_t *string_buffer_p = (jerry_char_t *) malloc (sizeof (jerry_char_t) * (string_size + 1));
  jerry_size_t copied_bytes = jerry_string_to_char_buffer (string_val, string_buffer_p, string_size);
  string_buffer_p[copied_bytes] = '\0';
  return string_buffer_p;
}

static int jcli_completion(int count, int key)
{
  jerry_value_t global_obj_val = jerry_get_global_object ();
  jerry_value_t complete = jerryx_get_property_str(global_obj_val, "complete");
  if (jerry_value_is_function (complete))
  {
    jerry_release_value(global_obj_val);
    jerry_value_t ret_val = call_single_str(complete, rl_line_buffer);
    if (jerry_value_is_null(ret_val))
      rl_on_new_line();
    else if (jerry_value_is_string(ret_val))
    {
      jerry_char_t *string_buffer_p = allocate_string(ret_val);
      rl_insert_text(&string_buffer_p[rl_point]);
      free (string_buffer_p);
    }
    jerry_release_value(ret_val);
  }
  return 0;
}

int main(int argc, char *argv[])
{
  irz_module_register();
  jerry_init (JERRY_INIT_EMPTY);
  register_js_function("print", jerryx_handler_print);
  register_js_function("require", handle_require);

  char *buf = loadfile("./index.js");

  if (!buf)
  {
    puts("file not found");
    jerry_cleanup();
  }

  jerry_release_value(execute(buf));

  jerry_value_t global_obj_val = jerry_get_global_object ();
  jerry_value_t interpret = jerryx_get_property_str(global_obj_val, "interpret");
  jerry_value_t prompt_val = jerryx_get_property_str(global_obj_val, "prompt");
  jerry_release_value(global_obj_val);
  if (jerry_value_is_function (interpret))
  {
    rl_bind_key('\t', jcli_completion);
    while(1)
    {
      jerry_char_t *prompt = allocate_string(prompt_val);
      char * input = readline(prompt);
      free (prompt);
      if (!input)
        break;
      jerry_value_t ret_val = call_single_str(interpret, input);
      free(input);
      if (jerry_value_is_null(ret_val))
        break;
      jerry_release_value(ret_val);
    }
  }
  else
    puts("Error: no interpret() global function defined");

  jerry_cleanup();
  return 0;
}
