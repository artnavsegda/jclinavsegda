#!/bin/sh
gcc exception.c  irz-module.c  main.c -o cli $(pkg-config --cflags --libs libjerry-core libjerry-ext libjerry-port-default libjerry-libm) -lreadline
