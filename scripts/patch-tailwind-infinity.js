const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "src", "index.build.css");
const css = fs.readFileSync(cssPath, "utf8");
const patched = css.replace(/calc\(infinity \* 1px\)/g, "9999px");

if (patched === css) {
  process.exit(0);
}

fs.writeFileSync(cssPath, patched);
console.log("Patched calc(infinity * 1px) for CRA css-minimizer compatibility.");
