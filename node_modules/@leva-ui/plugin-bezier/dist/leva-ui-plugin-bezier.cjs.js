'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./leva-ui-plugin-bezier.cjs.prod.js");
} else {
  module.exports = require("./leva-ui-plugin-bezier.cjs.dev.js");
}
