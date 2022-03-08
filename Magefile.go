//+build mage

package main

import (
	"fmt"
	// "github.com/magefile/mage/sh"
	// mage:import
	build "github.com/grafana/grafana-plugin-sdk-go/build"	 
)

// Hello prints a message (shows that you can define custom Mage targets).
func Hello() {
	fmt.Println("hello plugin developer!")
}

// Default configures the default target.
var Default = build.BuildAll





