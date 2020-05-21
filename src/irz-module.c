#include <stdlib.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include "jerryscript.h"
#include "jerryscript-ext/module.h"
#include "jerryscript-ext/handler.h"

#define MODULE_NAME irz_module

static jerry_value_t module_cat_handler(const jerry_value_t function_object, const jerry_value_t function_this, const jerry_value_t arguments[], const jerry_length_t arguments_count)
{
  if (arguments_count > 0)
  {
    jerry_value_t string_value = jerry_value_to_string (arguments[0]);
    jerry_char_t buffer[256];

    jerry_size_t copied_bytes = jerry_string_to_utf8_char_buffer (string_value, buffer, sizeof (buffer) - 1);
    buffer[copied_bytes] = '\0';

    jerry_release_value (string_value);

    int filetoread = open(buffer,O_RDONLY);

    if (filetoread != -1)
    {
      struct stat sb;
      fstat(filetoread, &sb);
      char *filecontent = malloc(sb.st_size);

      int length = read(filetoread,filecontent,sb.st_size);
      filecontent[length] = '\0';
      close(filetoread);
      jerry_value_t returnvalue = jerry_create_string (filecontent);
      free(filecontent);
      return returnvalue;
    }
  }
  return jerry_create_undefined();
}

static jerry_value_t module_system_handler(const jerry_value_t function_object, const jerry_value_t function_this, const jerry_value_t arguments[], const jerry_length_t arguments_count)
{
  if (arguments_count > 0)
  {
    jerry_value_t string_value = jerry_value_to_string (arguments[0]);
    jerry_char_t buffer[256];
    jerry_size_t copied_bytes = jerry_string_to_utf8_char_buffer (string_value, buffer, sizeof (buffer) - 1);
    buffer[copied_bytes] = '\0';
    jerry_release_value (string_value);
    return jerry_create_number (WEXITSTATUS(system(buffer)));
  }
  else
    printf ("System handler was called\n");

  return jerry_create_undefined();
}

#define CHUNK 10
static char * allocate_stream(FILE * stream)
{
  char * buf = malloc(CHUNK+1);
  int chunkcounter, totalcounter = 0, limit = CHUNK;

  while (1)
  {
    chunkcounter = fread(&buf[totalcounter], 1, CHUNK, stream);
    totalcounter += chunkcounter;
    if (chunkcounter == CHUNK)
    {
      limit += CHUNK;
      char * newbuf = realloc(buf,limit+1);
      if (newbuf == NULL)
        break;
      else
        buf = newbuf;
    }
    else
      break;
  }
  buf[totalcounter] = '\0';
  return buf;
}

static jerry_value_t module_pipe_handler(const jerry_value_t function_object, const jerry_value_t function_this, const jerry_value_t arguments[], const jerry_length_t arguments_count)
{
  if (arguments_count > 0)
  {
    jerry_value_t string_value = jerry_value_to_string (arguments[0]);
    jerry_char_t buffer[256];
    jerry_size_t copied_bytes = jerry_string_to_utf8_char_buffer (string_value, buffer, sizeof (buffer) - 1);
    buffer[copied_bytes] = '\0';
    jerry_release_value (string_value);
    FILE * filetoread = popen(buffer, "r");
    char * filecontent = allocate_stream(filetoread);
    pclose(filetoread);
    jerry_value_t returnvalue = jerry_create_string (filecontent);
    free(filecontent);
    return returnvalue;
  }
  return jerry_create_undefined();
}

static jerry_value_t module_getenv_handler(const jerry_value_t function_object, const jerry_value_t function_this, const jerry_value_t arguments[], const jerry_length_t arguments_count)
{
  if (arguments_count > 0)
  {
    jerry_value_t string_value = jerry_value_to_string (arguments[0]);
    jerry_char_t buffer[256];
    jerry_size_t copied_bytes = jerry_string_to_utf8_char_buffer (string_value, buffer, sizeof (buffer) - 1);
    buffer[copied_bytes] = '\0';
    jerry_release_value (string_value);
    char * env_val = getenv(buffer);
    if (env_val)
      return jerry_create_string (env_val);
  }
  return jerry_create_undefined();
}

static void register_module_js_function (jerry_value_t module, const char *name_p, jerry_external_handler_t handler_p)
{
  jerry_value_t func_obj = jerry_create_external_function (handler_p);
  jerry_release_value (jerryx_set_property_str (module, name_p, func_obj));
  jerry_release_value (func_obj);
}

static jerry_value_t irz_module_on_resolve (void)
{
  jerry_value_t object = jerry_create_object ();

  register_module_js_function(object, "cat", module_cat_handler);
  register_module_js_function(object, "system", module_system_handler);
  register_module_js_function(object, "pipe", module_pipe_handler);
  register_module_js_function(object, "getenv", module_getenv_handler);

  return object;
}

JERRYX_NATIVE_MODULE (MODULE_NAME, irz_module_on_resolve)
