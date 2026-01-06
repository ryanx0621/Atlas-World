/*jshint node: true */
/*jslint unparam: true*/
'use strict';

/**
 * Check how fast various timers are in node.
 */

var Benchmark = require('benchmark');
var Microtime = require('microtime');

var suite = new Benchmark.Suite();

// add tests
suite.add('Date.now()', function() {
  // system time, not-monotonic, ms
  Date.now();
})
.add('Microtime.now()', function() {
  // system time, not-monotonic, us (POSIX: gettimeofday)
  Microtime.now();
})
.add('process.hrtime()', function() {
  // monotonic, ns (returns: [seconds, nanoseconds])
  process.hrtime();
})
.add('process.hrtime() ms-round', function() {
  // monotonic, ns (returns: [seconds, nanoseconds])
  var time = process.hrtime();
  return (time[0] * 1000) + Math.round(time[1] / 1000000);
})
.add('process.hrtime() ms-floor', function() {
  // monotonic, ns (returns: [seconds, nanoseconds])
  var time = process.hrtime();
  return (time[0] * 1000) + Math.floor(time[1] / 1000000);
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ 'async': true });
